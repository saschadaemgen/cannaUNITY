# backend/taskmanager/api_views.py

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Q, Avg, F
from django.db import models, transaction
from django.utils import timezone
from datetime import date, timedelta, datetime
from django.shortcuts import get_object_or_404

from .models import TaskType, TaskSchedule, TimeSlot, TaskBooking, TaskExperience
from .serializers import (
    TaskTypeSerializer, TaskScheduleSerializer, TaskScheduleSimpleSerializer,
    TaskScheduleCreateSerializer, TimeSlotSerializer, TimeSlotWithBookingsSerializer,
    TaskBookingSerializer, TaskBookingCreateSerializer, TaskExperienceSerializer,
    DashboardStatsSerializer, MemberDashboardSerializer
)
from members.models import Member

class TaskTypeViewSet(viewsets.ModelViewSet):
    """ViewSet für Aufgabentypen"""
    queryset = TaskType.objects.filter(is_active=True)
    serializer_class = TaskTypeSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter nach Schwierigkeitsgrad
        difficulty = self.request.query_params.get('difficulty')
        if difficulty:
            queryset = queryset.filter(difficulty=difficulty)
        
        return queryset.order_by('name')

class TaskScheduleViewSet(viewsets.ModelViewSet):
    """ViewSet für Aufgabenplanungen"""
    queryset = TaskSchedule.objects.filter(is_active=True)
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return TaskScheduleCreateSerializer
        elif self.action == 'list':
            return TaskScheduleSimpleSerializer
        return TaskScheduleSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter nach Datum
        date_param = self.request.query_params.get('date')
        if date_param:
            queryset = queryset.filter(date=date_param)
        
        # Filter nach Datumsbereich
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if start_date and end_date:
            queryset = queryset.filter(date__range=[start_date, end_date])
        
        # Filter nach Raum
        room_id = self.request.query_params.get('room')
        if room_id:
            queryset = queryset.filter(room_id=room_id)
        
        # Filter nach Aufgabentyp
        task_type_id = self.request.query_params.get('task_type')
        if task_type_id:
            queryset = queryset.filter(task_type_id=task_type_id)
        
        return queryset.select_related('task_type', 'room').prefetch_related(
            'time_slots__bookings__member'
        ).order_by('date', 'start_time')
    
    @action(detail=False, methods=['get'])
    def today(self, request):
        """Gibt alle Aufgabenplanungen für heute zurück"""
        today = date.today()
        schedules = self.get_queryset().filter(date=today)
        serializer = TaskScheduleSerializer(schedules, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def week(self, request):
        """Gibt alle Aufgabenplanungen für die aktuelle Woche zurück"""
        today = date.today()
        start_of_week = today - timedelta(days=today.weekday())
        end_of_week = start_of_week + timedelta(days=6)
        
        schedules = self.get_queryset().filter(
            date__range=[start_of_week, end_of_week]
        )
        serializer = TaskScheduleSimpleSerializer(schedules, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def duplicate(self, request, pk=None):
        """Dupliziert eine Aufgabenplanung für ein anderes Datum"""
        original_schedule = self.get_object()
        new_date = request.data.get('date')
        
        if not new_date:
            return Response(
                {'error': 'Datum ist erforderlich'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Prüfe ob bereits eine Planung für dieses Datum existiert
        if TaskSchedule.objects.filter(
            task_type=original_schedule.task_type,
            room=original_schedule.room,
            date=new_date
        ).exists():
            return Response(
                {'error': 'Für dieses Datum existiert bereits eine Planung'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        with transaction.atomic():
            # Erstelle neue Aufgabenplanung
            new_schedule = TaskSchedule.objects.create(
                task_type=original_schedule.task_type,
                room=original_schedule.room,
                date=new_date,
                start_time=original_schedule.start_time,
                end_time=original_schedule.end_time,
                max_slots=original_schedule.max_slots,
                max_participants_per_slot=original_schedule.max_participants_per_slot,
                notes=original_schedule.notes,
                created_by_id=request.user.id if hasattr(request.user, 'member') else None
            )
            
            # Kopiere Zeitslots
            for time_slot in original_schedule.time_slots.all():
                TimeSlot.objects.create(
                    schedule=new_schedule,
                    start_time=time_slot.start_time,
                    end_time=time_slot.end_time,
                    max_participants=time_slot.max_participants
                )
        
        serializer = TaskScheduleSerializer(new_schedule)
        return Response(serializer.data)

class TimeSlotViewSet(viewsets.ModelViewSet):
    """ViewSet für Zeitslots"""
    queryset = TimeSlot.objects.all()
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return TimeSlotWithBookingsSerializer
        return TimeSlotSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter nach Aufgabenplanung
        schedule_id = self.request.query_params.get('schedule')
        if schedule_id:
            queryset = queryset.filter(schedule_id=schedule_id)
        
        # Filter nach Verfügbarkeit
        available_only = self.request.query_params.get('available_only')
        if available_only == 'true':
            queryset = queryset.filter(is_blocked=False)
        
        return queryset.select_related('schedule__task_type', 'schedule__room').order_by('start_time')
    
    @action(detail=True, methods=['post'])
    def block(self, request, pk=None):
        """Sperrt einen Zeitslot"""
        time_slot = self.get_object()
        reason = request.data.get('reason', '')
        
        time_slot.is_blocked = True
        time_slot.block_reason = reason
        time_slot.save()
        
        # Storniere bestehende Buchungen
        cancelled_bookings = time_slot.bookings.filter(status='confirmed')
        for booking in cancelled_bookings:
            booking.cancel(f"Zeitslot gesperrt: {reason}")
        
        return Response({
            'message': 'Zeitslot wurde gesperrt',
            'cancelled_bookings': cancelled_bookings.count()
        })
    
    @action(detail=True, methods=['post'])
    def unblock(self, request, pk=None):
        """Entsperrt einen Zeitslot"""
        time_slot = self.get_object()
        
        time_slot.is_blocked = False
        time_slot.block_reason = ''
        time_slot.save()
        
        return Response({'message': 'Zeitslot wurde entsperrt'})

class TaskBookingViewSet(viewsets.ModelViewSet):
    """ViewSet für Aufgabenbuchungen"""
    queryset = TaskBooking.objects.all()
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return TaskBookingCreateSerializer
        return TaskBookingSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter nach Mitglied
        member_id = self.request.query_params.get('member')
        if member_id:
            queryset = queryset.filter(member_id=member_id)
        
        # Filter nach Status
        status_param = self.request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)
        
        # Filter nach Datum
        date_param = self.request.query_params.get('date')
        if date_param:
            queryset = queryset.filter(time_slot__schedule__date=date_param)
        
        return queryset.select_related(
            'member', 'time_slot__schedule__task_type', 'time_slot__schedule__room'
        ).order_by('-booked_at')
    
    def perform_create(self, serializer):
        """Erstellt eine neue Buchung"""
        booking = serializer.save()
        
        # Erfahrungspunkte für Buchung hinzufügen (optional)
        task_type = booking.time_slot.schedule.task_type
        experience, created = TaskExperience.objects.get_or_create(
            member=booking.member,
            task_type=task_type,
            defaults={'experience_points': 0, 'completed_tasks': 0}
        )
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Storniert eine Buchung"""
        booking = self.get_object()
        reason = request.data.get('reason', '')
        
        if booking.status != 'confirmed':
            return Response(
                {'error': 'Nur bestätigte Buchungen können storniert werden'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        booking.cancel(reason)
        
        return Response({'message': 'Buchung wurde storniert'})
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Markiert eine Buchung als abgeschlossen"""
        booking = self.get_object()
        rating = request.data.get('rating')
        notes = request.data.get('notes', '')
        work_quality_rating = request.data.get('work_quality_rating')
        supervisor_notes = request.data.get('supervisor_notes', '')
        
        if booking.status != 'confirmed':
            return Response(
                {'error': 'Nur bestätigte Buchungen können abgeschlossen werden'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        booking.complete(rating, notes)
        
        if work_quality_rating:
            booking.work_quality_rating = work_quality_rating
        if supervisor_notes:
            booking.supervisor_notes = supervisor_notes
        booking.save()
        
        # Erfahrungspunkte hinzufügen
        task_type = booking.time_slot.schedule.task_type
        experience, created = TaskExperience.objects.get_or_create(
            member=booking.member,
            task_type=task_type,
            defaults={'experience_points': 0, 'completed_tasks': 0}
        )
        
        # Punkte basierend auf Schwierigkeitsgrad
        points_map = {'leicht': 1, 'mittel': 2, 'anspruchsvoll': 3}
        points = points_map.get(task_type.difficulty, 1)
        
        experience.add_experience(points, rating)
        
        return Response({'message': 'Buchung wurde abgeschlossen'})
    
    @action(detail=True, methods=['post'])
    def check_in(self, request, pk=None):
        """Check-in für eine Buchung"""
        booking = self.get_object()
        
        if booking.status != 'confirmed':
            return Response(
                {'error': 'Nur bestätigte Buchungen können eingecheckt werden'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        booking.check_in_time = timezone.now()
        booking.save()
        
        return Response({'message': 'Check-in erfolgreich'})
    
    @action(detail=True, methods=['post'])
    def check_out(self, request, pk=None):
        """Check-out für eine Buchung"""
        booking = self.get_object()
        
        if not booking.check_in_time:
            return Response(
                {'error': 'Check-in ist erforderlich vor Check-out'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        booking.check_out_time = timezone.now()
        booking.save()
        
        return Response({'message': 'Check-out erfolgreich'})

class DashboardViewSet(viewsets.ViewSet):
    """ViewSet für Dashboard-Statistiken"""
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Allgemeine Dashboard-Statistiken"""
        today = date.today()
        week_start = today - timedelta(days=today.weekday())
        week_end = week_start + timedelta(days=6)
        
        # Heute Statistiken
        today_schedules = TaskSchedule.objects.filter(date=today, is_active=True)
        today_slots = TimeSlot.objects.filter(schedule__in=today_schedules)
        today_bookings = TaskBooking.objects.filter(
            time_slot__in=today_slots, 
            status='confirmed'
        )
        
        total_slots_today = today_slots.count()
        booked_slots_today = today_bookings.count()
        available_slots_today = total_slots_today - booked_slots_today
        utilization_rate = (booked_slots_today / total_slots_today * 100) if total_slots_today > 0 else 0
        
        # Wöchentliche Statistiken
        week_schedules = TaskSchedule.objects.filter(
            date__range=[week_start, week_end], 
            is_active=True
        )
        week_bookings = TaskBooking.objects.filter(
            time_slot__schedule__in=week_schedules
        )
        
        # Top aktive Mitglieder (diese Woche)
        most_active_members = Member.objects.filter(
            task_bookings__in=week_bookings,
            task_bookings__status='confirmed'
        ).annotate(
            booking_count=Count('task_bookings')
        ).order_by('-booking_count')[:5]
        
        # Aufgabenverteilung
        task_distribution = {}
        for task_type in TaskType.objects.filter(is_active=True):
            task_distribution[task_type.name] = TaskBooking.objects.filter(
                time_slot__schedule__task_type=task_type,
                time_slot__schedule__date=today,
                status='confirmed'
            ).count()
        
        data = {
            'total_tasks_today': today_schedules.count(),
            'total_time_slots_today': total_slots_today,
            'booked_slots_today': booked_slots_today,
            'available_slots_today': available_slots_today,
            'utilization_rate_today': round(utilization_rate, 1),
            
            'tasks_this_week': week_schedules.count(),
            'completed_bookings_this_week': week_bookings.filter(status='completed').count(),
            'cancelled_bookings_this_week': week_bookings.filter(status='cancelled').count(),
            
            'most_active_members': most_active_members,
            'task_distribution': task_distribution
        }
        
        serializer = DashboardStatsSerializer(data)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def member_dashboard(self, request):
        """Mitgliedsspezifisches Dashboard"""
        member_uuid = request.query_params.get('member')
        if not member_uuid:
            return Response(
                {'error': 'Member UUID ist erforderlich'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        member = get_object_or_404(Member, uuid=member_uuid)
        
        # Kommende Buchungen
        upcoming_bookings = TaskBooking.objects.filter(
            member=member,
            status='confirmed',
            time_slot__schedule__date__gte=date.today()
        ).select_related(
            'time_slot__schedule__task_type', 
            'time_slot__schedule__room'
        ).order_by('time_slot__schedule__date', 'time_slot__start_time')[:10]
        
        # Statistiken
        completed_count = TaskBooking.objects.filter(
            member=member, status='completed'
        ).count()
        
        cancelled_count = TaskBooking.objects.filter(
            member=member, status='cancelled'
        ).count()
        
        # Erfahrungspunkte
        experiences = TaskExperience.objects.filter(member=member)
        total_experience = sum(exp.experience_points for exp in experiences)
        
        # Verfügbare Aufgaben heute
        today = date.today()
        available_tasks = TaskSchedule.objects.filter(
            date=today,
            is_active=True
        ).annotate(
            booked_count=Count('time_slots__bookings', filter=Q(time_slots__bookings__status='confirmed'))
        ).filter(
            booked_count__lt=F('max_slots')
        ).select_related('task_type', 'room')
        
        data = {
            'upcoming_bookings': upcoming_bookings,
            'completed_bookings_count': completed_count,
            'cancelled_bookings_count': cancelled_count,
            'total_experience_points': total_experience,
            'task_experiences': experiences,
            'available_tasks_today': available_tasks
        }
        
        serializer = MemberDashboardSerializer(data)
        return Response(serializer.data)