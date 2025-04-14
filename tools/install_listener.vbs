Set WshShell = CreateObject("WScript.Shell")
startupPath = WshShell.SpecialFolders("Startup")
Set FSO = CreateObject("Scripting.FileSystemObject")

' Absoluter Pfad zur Batch-Datei – HIER ANPASSEN!
listenerBat = Chr(34) & "C:\Users\sash710\avre\cannaUNITY\tools\start-listener.bat" & Chr(34)

' Pfad zur VBS-Datei im Autostart
vbsPath = startupPath & "\start-listener-hidden.vbs"

' Inhalt der VBS-Datei zum Starten im Hintergrund
vbsContent = "Set WshShell = CreateObject(""WScript.Shell"")" & vbCrLf & _
             "WshShell.Run " & listenerBat & ", 0, False"

Set file = FSO.CreateTextFile(vbsPath, True)
file.Write vbsContent
file.Close

MsgBox "Der cannaUNITY Listener wurde erfolgreich zum Autostart hinzugefügt." & vbCrLf & vbCrLf & _
       "Er startet beim nächsten Systemstart automatisch im Hintergrund." & vbCrLf & _
       "Alternativ können Sie sich ab- und wieder anmelden.", vbInformation, "Autostart eingerichtet"
