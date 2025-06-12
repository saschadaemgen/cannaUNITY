<?php
/**
 * Plugin Name: cannaUNITY Balance Display v1.2.0
 * Plugin URI: https://cannaunity.de
 * Description: Zeigt Kontostände und Benutzerinformationen für cannaUNITY-Mitglieder im WordPress Frontend an.
 * Version: 1.2.0
 * Author: Sascha Dämgen IT and More
 * Author URI: https://itandmore.de
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: cannaunity-balance
 * Domain Path: /languages
 * Requires at least: 5.0
 * Tested up to: 6.4
 * Requires PHP: 7.4
 * Network: false
 * 
 * Plugin File: cannaunity-balance-display-v1.2.0.php
 * 
 * Copyright (C) 2024 Sascha Dämgen IT and More
 * 
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA 02110-1301 USA
 */

// Verhindert direkten Zugriff
if (!defined('ABSPATH')) {
    exit;
}

class CannaUnityBalancePlugin {
    
    public function __construct() {
        add_action('init', array($this, 'init'));
        add_action('wp_enqueue_scripts', array($this, 'enqueue_styles'));
        register_activation_hook(__FILE__, array($this, 'activate'));
        register_deactivation_hook(__FILE__, array($this, 'deactivate'));
        add_action('admin_menu', array($this, 'add_admin_menu'));
    }
    
    public function init() {
        // Shortcodes registrieren
        add_shortcode('user_balance', array($this, 'display_balance_shortcode'));
        add_shortcode('user_dashboard', array($this, 'display_dashboard_shortcode'));
        add_shortcode('user_profile', array($this, 'display_profile_shortcode'));
        add_shortcode('cannaunity_balance', array($this, 'display_balance_shortcode'));
        
        // AJAX für dynamische Updates
        add_action('wp_ajax_get_user_balance', array($this, 'ajax_get_balance'));
        add_action('wp_ajax_nopriv_get_user_balance', array($this, 'ajax_get_balance'));
    }
    
    // Plugin-Styles
    public function enqueue_styles() {
        wp_enqueue_style(
            'cannaunity-balance-style',
            plugin_dir_url(__FILE__) . 'style.css',
            array(),
            '1.2.0'
        );
        
        // cannaUNITY Design CSS
        $custom_css = "
        .cannaunity-balance-container {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 12px;
            padding: 25px;
            margin: 20px 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        
        .cannaunity-balance-display {
            text-align: center;
            background: linear-gradient(135deg, #2E7D32 0%, #4CAF50 50%, #66BB6A 100%);
            color: white;
            padding: 30px;
            border-radius: 15px;
            margin: 20px 0;
            position: relative;
            overflow: hidden;
        }
        
        .cannaunity-balance-display::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 50%);
            animation: shimmer 3s ease-in-out infinite;
        }
        
        @keyframes shimmer {
            0%, 100% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
            50% { transform: translateX(100%) translateY(100%) rotate(45deg); }
        }
        
        .balance-amount {
            font-size: 2.8em;
            font-weight: bold;
            display: block;
            margin: 15px 0;
            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
            position: relative;
            z-index: 2;
        }
        
        .balance-label {
            font-size: 1.3em;
            opacity: 0.95;
            font-weight: 500;
            position: relative;
            z-index: 2;
        }
        
        .cannaunity-info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 20px;
            margin: 25px 0;
        }
        
        .cannaunity-info-card {
            background: white;
            padding: 20px;
            border-radius: 10px;
            border-left: 5px solid #4CAF50;
            box-shadow: 0 3px 8px rgba(0,0,0,0.1);
            transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        
        .cannaunity-info-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0,0,0,0.15);
        }
        
        .info-label {
            font-weight: bold;
            color: #2E7D32;
            display: block;
            margin-bottom: 8px;
            font-size: 0.95em;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .info-value {
            color: #1B5E20;
            font-size: 1.2em;
            font-weight: 600;
        }
        
        .cannaunity-login-required {
            text-align: center;
            padding: 25px;
            background: linear-gradient(135deg, #FFF3E0, #FFE0B2);
            border: 2px solid #FF9800;
            border-radius: 12px;
            color: #E65100;
            font-weight: 500;
        }
        
        .cannaunity-error-message {
            text-align: center;
            padding: 20px;
            background: linear-gradient(135deg, #FFEBEE, #FFCDD2);
            border: 2px solid #F44336;
            border-radius: 12px;
            color: #C62828;
            font-weight: 500;
        }
        
        .cannaunity-header {
            text-align: center;
            margin-bottom: 25px;
        }
        
        .cannaunity-header h3 {
            color: #2E7D32;
            margin: 0;
            padding-bottom: 10px;
            border-bottom: 3px solid #4CAF50;
            display: inline-block;
            font-size: 1.8em;
        }
        
        .cannaunity-thc-limit {
            border-left-color: #FF9800 !important;
        }
        
        .cannaunity-daily-limit {
            border-left-color: #E91E63 !important;
        }
        
        .cannaunity-monthly-limit {
            border-left-color: #2196F3 !important;
        }
        
        .cannaunity-financial {
            border-left-color: #4CAF50 !important;
        }
        
        .cannaunity-health {
            border-left-color: #9C27B0 !important;
        }
        
        .cannaunity-mental {
            border-left-color: #673AB7 !important;
        }
        
        .cannaunity-hours {
            border-left-color: #795548 !important;
        }
        ";
        
        wp_add_inline_style('cannaunity-balance-style', $custom_css);
    }
    
    // Kontostand abrufen
    private function get_user_meta_safe($user_id, $meta_key, $default = null) {
        $value = get_user_meta($user_id, $meta_key, true);
        return ($value !== '' && $value !== false) ? $value : $default;
    }
    
    // Shortcode: [user_balance] oder [cannaunity_balance]
    public function display_balance_shortcode($atts) {
        $atts = shortcode_atts(array(
            'field' => 'kontostand',
            'currency' => '€',
            'decimals' => 2,
            'show_label' => true
        ), $atts);
        
        if (!is_user_logged_in()) {
            return '<div class="cannaunity-login-required">
                        🌿 Bitte loggen Sie sich ein, um Ihren cannaUNITY-Kontostand zu sehen.
                    </div>';
        }
        
        $user_id = get_current_user_id();
        $balance = $this->get_user_meta_safe($user_id, $atts['field'], 0);
        
        $formatted_balance = number_format(
            floatval($balance), 
            intval($atts['decimals']), 
            ',', 
            '.'
        );
        
        $output = '<div class="cannaunity-balance-container">';
        $output .= '<div class="cannaunity-balance-display">';
        
        if ($atts['show_label']) {
            $output .= '<span class="balance-label">🌿 Ihr cannaUNITY Kontostand</span>';
        }
        
        $output .= '<span class="balance-amount">' . esc_html($formatted_balance) . ' ' . esc_html($atts['currency']) . '</span>';
        $output .= '</div>';
        $output .= '</div>';
        
        return $output;
    }
    
    // Shortcode: [user_dashboard]
    public function display_dashboard_shortcode($atts) {
        if (!is_user_logged_in()) {
            return '<div class="cannaunity-login-required">
                        🌿 Bitte loggen Sie sich ein, um Ihr cannaUNITY-Dashboard zu sehen.
                    </div>';
        }
        
        $user_id = get_current_user_id();
        $current_user = wp_get_current_user();
        
        // cannaUNITY Meta-Felder abrufen
        $kontostand = $this->get_user_meta_safe($user_id, 'kontostand', 0);
        $monatsbeitrag = $this->get_user_meta_safe($user_id, 'monatsbeitrag', 0);
        $thc_limit = $this->get_user_meta_safe($user_id, 'thc_limit');
        $daily_limit = $this->get_user_meta_safe($user_id, 'daily_limit');
        $monthly_limit = $this->get_user_meta_safe($user_id, 'monthly_limit');
        $koerperliche_einschraenkungen = $this->get_user_meta_safe($user_id, 'koerperliche_einschraenkungen');
        $geistliche_einschraenkungen = $this->get_user_meta_safe($user_id, 'geistliche_einschraenkungen');
        $pflichtstunden = $this->get_user_meta_safe($user_id, 'pflichtstunden');
        
        $output = '<div class="cannaunity-balance-container">';
        $output .= '<div class="cannaunity-header">';
        $output .= '<h3>🌿 Mein cannaUNITY-Dashboard</h3>';
        $output .= '</div>';
        
        // Kontostand prominent anzeigen
        $output .= '<div class="cannaunity-balance-display">';
        $output .= '<span class="balance-label">Aktueller Kontostand</span>';
        $output .= '<span class="balance-amount">' . number_format($kontostand, 2, ',', '.') . ' €</span>';
        $output .= '</div>';
        
        // Weitere Informationen in Grid
        $output .= '<div class="cannaunity-info-grid">';
        
        // Benutzerdaten mit UUID-Anonymisierung
        $user_uuid = $this->get_user_meta_safe($user_id, 'uuid');
        $display_name = $user_uuid ? substr($user_uuid, 0, 8) : substr($current_user->user_login, 0, 8);
        
        $output .= '<div class="cannaunity-info-card">';
        $output .= '<span class="info-label">🆔 Benutzer-ID:</span>';
        $output .= '<span class="info-value">' . esc_html($display_name) . '</span>';
        $output .= '</div>';
        
        // E-Mail wird nicht angezeigt (Anonymisierung)
        $output .= '<div class="cannaunity-info-card">';
        $output .= '<span class="info-label">📧 E-Mail:</span>';
        $output .= '<span class="info-value">***@cannaunity.de</span>';
        $output .= '</div>';
        
        // Finanzielle Informationen
        $output .= '<div class="cannaunity-info-card cannaunity-financial">';
        $output .= '<span class="info-label">💰 Monatsbeitrag:</span>';
        $output .= '<span class="info-value">' . ($monatsbeitrag ? number_format($monatsbeitrag, 2, ',', '.') . ' €' : 'Nicht gesetzt') . '</span>';
        $output .= '</div>';
        
        // cannaUNITY Meta-Felder - immer anzeigen
        $output .= '<div class="cannaunity-info-card cannaunity-thc-limit">';
        $output .= '<span class="info-label">🌿 THC-Limit:</span>';
        $output .= '<span class="info-value">' . ($thc_limit ? esc_html($thc_limit) . ' %' : 'Nicht gesetzt') . '</span>';
        $output .= '</div>';
        
        $output .= '<div class="cannaunity-info-card cannaunity-daily-limit">';
        $output .= '<span class="info-label">📅 Tageslimit:</span>';
        $output .= '<span class="info-value">' . ($daily_limit ? esc_html($daily_limit) . ' g' : 'Nicht gesetzt') . '</span>';
        $output .= '</div>';
        
        $output .= '<div class="cannaunity-info-card cannaunity-monthly-limit">';
        $output .= '<span class="info-label">📊 Monatslimit:</span>';
        $output .= '<span class="info-value">' . ($monthly_limit ? esc_html($monthly_limit) . ' g' : 'Nicht gesetzt') . '</span>';
        $output .= '</div>';
        
        // Gesundheitliche Informationen - immer anzeigen
        $output .= '<div class="cannaunity-info-card cannaunity-health">';
        $output .= '<span class="info-label">🦽 Körperliche Einschränkungen:</span>';
        $output .= '<span class="info-value">' . ($koerperliche_einschraenkungen ? esc_html($koerperliche_einschraenkungen) : 'Keine Angabe') . '</span>';
        $output .= '</div>';
        
        $output .= '<div class="cannaunity-info-card cannaunity-mental">';
        $output .= '<span class="info-label">🧠 Geistige Einschränkungen:</span>';
        $output .= '<span class="info-value">' . ($geistliche_einschraenkungen ? esc_html($geistliche_einschraenkungen) : 'Keine Angabe') . '</span>';
        $output .= '</div>';
        
        // Pflichtstunden - immer anzeigen
        $output .= '<div class="cannaunity-info-card cannaunity-hours">';
        $output .= '<span class="info-label">⏰ Pflichtstunden:</span>';
        $output .= '<span class="info-value">' . ($pflichtstunden ? esc_html($pflichtstunden) . ' Stunden' : 'Nicht gesetzt') . '</span>';
        $output .= '</div>';
        
        // Mitgliedschaft seit
        $user_registered = get_userdata($user_id)->user_registered;
        $member_since = date('d.m.Y', strtotime($user_registered));
        $output .= '<div class="cannaunity-info-card">';
        $output .= '<span class="info-label">🗓️ Mitglied seit:</span>';
        $output .= '<span class="info-value">' . esc_html($member_since) . '</span>';
        $output .= '</div>';
        
        $output .= '</div>'; // Ende Grid
        $output .= '</div>'; // Ende Container
        
        return $output;
    }
    
    // Shortcode: [user_profile] - Kompakte Version
    public function display_profile_shortcode($atts) {
        if (!is_user_logged_in()) {
            return '<div class="cannaunity-login-required">🌿 Bitte einloggen</div>';
        }
        
        $user_id = get_current_user_id();
        $current_user = wp_get_current_user();
        $kontostand = $this->get_user_meta_safe($user_id, 'kontostand', 0);
        
        $output = '<div class="cannaunity-balance-container">';
        $output .= '<p><strong>🌿 ' . esc_html($current_user->display_name) . '</strong></p>';
        $output .= '<p>Kontostand: <strong>' . number_format($kontostand, 2, ',', '.') . ' €</strong></p>';
        $output .= '</div>';
        
        return $output;
    }
    
    // AJAX Handler
    public function ajax_get_balance() {
        if (!is_user_logged_in()) {
            wp_send_json_error('Nicht eingeloggt');
        }
        
        $user_id = get_current_user_id();
        $balance = $this->get_user_meta_safe($user_id, 'kontostand', 0);
        
        wp_send_json_success(array(
            'balance' => number_format($balance, 2, ',', '.')
        ));
    }
    
    // Admin-Menu
    public function add_admin_menu() {
        add_options_page(
            'cannaUNITY Balance Einstellungen',
            'cannaUNITY Balance',
            'manage_options',
            'cannaunity-balance-settings',
            array($this, 'admin_page')
        );
    }
    
    // Admin-Seite
    public function admin_page() {
        ?>
        <style>
        .cannaunity-admin-container {
            max-width: 100%;
            margin-top: 20px;
        }
        
        .cannaunity-admin-grid {
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 30px;
            margin-top: 20px;
        }
        
        .cannaunity-admin-left {
            display: flex;
            flex-direction: column;
            gap: 25px;
        }
        
        .cannaunity-admin-right {
            display: flex;
            flex-direction: column;
            gap: 25px;
        }
        
        .cannaunity-card {
            background: #fff;
            border: 1px solid #c3c4c7;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            padding: 20px;
        }
        
        .cannaunity-card h2 {
            margin-top: 0;
            color: #2E7D32;
            border-bottom: 2px solid #4CAF50;
            padding-bottom: 10px;
        }
        
        .cannaunity-shortcode-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 15px;
            margin-top: 15px;
        }
        
        .cannaunity-shortcode-item {
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 6px;
            padding: 15px;
            border-left: 4px solid #4CAF50;
        }
        
        .cannaunity-shortcode-item h4 {
            margin: 0 0 8px 0;
            color: #2E7D32;
        }
        
        .cannaunity-shortcode-item p {
            margin: 0;
            font-size: 14px;
            color: #666;
        }
        
        .cannaunity-example-box {
            background: #f1f8e9;
            border: 1px solid #c5e1a5;
            border-radius: 4px;
            padding: 12px;
            margin: 8px 0;
            font-family: monospace;
            font-size: 13px;
        }
        
        .cannaunity-info-badge {
            display: inline-block;
            background: #4CAF50;
            color: white;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: bold;
            margin-right: 5px;
        }
        
        .cannaunity-meta-field {
            background: #fff;
            border: 1px solid #4CAF50;
            border-radius: 6px;
            padding: 12px;
            margin: 8px 0;
        }
        
        .cannaunity-meta-field strong {
            color: #2E7D32;
        }
        
        @media (max-width: 1200px) {
            .cannaunity-admin-grid {
                grid-template-columns: 1fr;
            }
        }
        
        @media (max-width: 768px) {
            .cannaunity-shortcode-grid {
                grid-template-columns: 1fr;
            }
        }
        </style>
        
        <div class="wrap">
            <h1 style="display: flex; align-items: center; gap: 10px;">
                🌿 <span style="color: #2E7D32;">cannaUNITY Balance Display</span> 
                <span style="background: #4CAF50; color: white; padding: 4px 12px; border-radius: 15px; font-size: 14px;">v1.2.0</span>
            </h1>
            
            <div class="cannaunity-admin-container">
                <div class="cannaunity-admin-grid">
                    
                    <!-- Linke Spalte - Hauptinhalte -->
                    <div class="cannaunity-admin-left">
                        
                        <!-- Verfügbare Shortcodes -->
                        <div class="cannaunity-card">
                            <h2>📝 Verfügbare Shortcodes</h2>
                            <div class="cannaunity-shortcode-grid">
                                <div class="cannaunity-shortcode-item">
                                    <h4><code>[user_balance]</code></h4>
                                    <p><strong>Zeigt nur den Kontostand</strong><br>
                                    Für einzelne Seiten oder Posts</p>
                                </div>
                                <div class="cannaunity-shortcode-item">
                                    <h4><code>[user_dashboard]</code></h4>
                                    <p><strong>Vollständiges Mitglieder-Dashboard</strong><br>
                                    Für Mitgliederbereich oder Profilseiten</p>
                                </div>
                                <div class="cannaunity-shortcode-item">
                                    <h4><code>[user_profile]</code></h4>
                                    <p><strong>Kompakte Profilanzeige</strong><br>
                                    Für Widgets oder kleine Bereiche</p>
                                </div>
                                <div class="cannaunity-shortcode-item">
                                    <h4><code>[cannaunity_balance]</code></h4>
                                    <p><strong>Alternative zu [user_balance]</strong><br>
                                    Für cannaUNITY-spezifische Anwendungen</p>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Parameter -->
                        <div class="cannaunity-card">
                            <h2>⚙️ Parameter für [user_balance] und [cannaunity_balance]</h2>
                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;">
                                <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; border-left: 4px solid #FF9800;">
                                    <h4 style="margin: 0 0 8px 0; color: #FF9800;">field</h4>
                                    <p style="margin: 0; font-size: 13px;"><strong>Standard:</strong> "kontostand"<br>
                                    <strong>Beispiel:</strong> <code>field="guthaben"</code></p>
                                </div>
                                <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; border-left: 4px solid #2196F3;">
                                    <h4 style="margin: 0 0 8px 0; color: #2196F3;">currency</h4>
                                    <p style="margin: 0; font-size: 13px;"><strong>Standard:</strong> "€"<br>
                                    <strong>Beispiel:</strong> <code>currency="USD"</code></p>
                                </div>
                                <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; border-left: 4px solid #9C27B0;">
                                    <h4 style="margin: 0 0 8px 0; color: #9C27B0;">decimals</h4>
                                    <p style="margin: 0; font-size: 13px;"><strong>Standard:</strong> "2"<br>
                                    <strong>Beispiel:</strong> <code>decimals="0"</code></p>
                                </div>
                                <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; border-left: 4px solid #795548;">
                                    <h4 style="margin: 0 0 8px 0; color: #795548;">show_label</h4>
                                    <p style="margin: 0; font-size: 13px;"><strong>Standard:</strong> "true"<br>
                                    <strong>Beispiel:</strong> <code>show_label="false"</code></p>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Beispiele -->
                        <div class="cannaunity-card">
                            <h2>💡 Beispiele</h2>
                            <h3 style="color: #2E7D32;">Basis-Verwendung:</h3>
                            <div class="cannaunity-example-box">[user_balance] <span style="color: #666;">– Zeigt Kontostand mit Standard-Einstellungen</span></div>
                            <div class="cannaunity-example-box">[user_dashboard] <span style="color: #666;">– Komplettes Dashboard</span></div>
                            
                            <h3 style="color: #2E7D32;">Mit benutzerdefinierten Parametern:</h3>
                            <div class="cannaunity-example-box">[user_balance currency="USD" decimals="0"] <span style="color: #666;">– US-Dollar ohne Nachkommastellen</span></div>
                            <div class="cannaunity-example-box">[cannaunity_balance show_label="false"] <span style="color: #666;">– Nur Betrag ohne Label</span></div>
                            <div class="cannaunity-example-box">[user_balance field="mein_guthaben" currency="CHF"] <span style="color: #666;">– Anderes Feld in Schweizer Franken</span></div>
                        </div>
                        
                    </div>
                    
                    <!-- Rechte Spalte - Sidebar-Inhalte -->
                    <div class="cannaunity-admin-right">
                        
                        <!-- Sicherheitsarchitektur -->
                        <div class="cannaunity-card">
                            <h2>🔒 Zero-Knowledge Sicherheitsarchitektur</h2>
                            <div style="background: #e8f5e8; border: 1px solid #4CAF50; border-radius: 8px; padding: 15px; margin-bottom: 15px;">
                                <p style="margin: 0; color: #2E7D32; font-weight: 500;">
                                    ✅ <strong>WordPress kennt keine Django-Backend-Credentials</strong>
                                </p>
                            </div>
                            
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                                <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; border-left: 4px solid #4CAF50;">
                                    <h4 style="margin: 0 0 8px 0; color: #2E7D32;">✅ Django-Backend HAT:</h4>
                                    <ul style="margin: 0; padding-left: 15px; font-size: 13px; color: #666;">
                                        <li>WordPress-DB-Zugang via SSH-Tunnel</li>
                                        <li>Schreib-/Lesezugriff auf wp_usermeta</li>
                                        <li>Sichere Kontostand-Updates</li>
                                        <li>Vollständige Backend-Kontrolle</li>
                                    </ul>
                                </div>
                                
                                <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; border-left: 4px solid #FF5722;">
                                    <h4 style="margin: 0 0 8px 0; color: #D84315;">❌ WordPress KENNT NICHT:</h4>
                                    <ul style="margin: 0; padding-left: 15px; font-size: 13px; color: #666;">
                                        <li>Django-Datenbank-Credentials</li>
                                        <li>Backend-Server-Zugangsdaten</li>
                                        <li>SSH-Tunnel-Konfiguration</li>
                                        <li>Interne Systemarchitektur</li>
                                    </ul>
                                </div>
                            </div>
                            
                            <div style="background: #e3f2fd; border: 1px solid #2196F3; border-radius: 6px; padding: 12px; margin-top: 15px;">
                                <p style="margin: 0; font-size: 13px; color: #1565C0;">
                                    <strong>🔒 SSH-Tunnel-Sicherheit:</strong> Keine direkten externen IP-Zugriffe auf Datenbanken möglich. Alle Verbindungen laufen verschlüsselt über SSH.
                                </p>
                            </div>
                            
                            <div style="background: #fff3e0; border: 1px solid #FF9800; border-radius: 6px; padding: 12px; margin-top: 10px;">
                                <p style="margin: 0; font-size: 13px; color: #E65100;">
                                    <strong>🛡️ Einseitige Kommunikation:</strong> Django → WordPress (via SSH). WordPress kann nicht auf Django-Backend zugreifen.
                                </p>
                            </div>
                        </div>
                        
                        <!-- Daten-Anonymisierung -->
                        <div class="cannaunity-card">
                            <h2>🕶️ Online-Portal Anonymisierung</h2>
                            <div style="background: #f3e5f5; border: 1px solid #9C27B0; border-radius: 8px; padding: 15px; margin-bottom: 15px;">
                                <p style="margin: 0; color: #7B1FA2; font-weight: 500;">
                                    🔐 <strong>Keine personenbezogenen Daten online entschlüsselbar</strong>
                                </p>
                            </div>
                            
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                                <div style="background: #ffebee; padding: 15px; border-radius: 6px; border-left: 4px solid #F44336;">
                                    <h4 style="margin: 0 0 8px 0; color: #C62828;">❌ NICHT Online gespeichert:</h4>
                                    <ul style="margin: 0; padding-left: 15px; font-size: 13px; color: #666;">
                                        <li>Echte E-Mail-Adressen</li>
                                        <li>Telefonnummern</li>
                                        <li>Wohnadressen</li>
                                        <li>Echte Namen</li>
                                        <li>Geburtsdaten</li>
                                        <li>Entschlüsselungs-Schlüssel</li>
                                    </ul>
                                </div>
                                
                                <div style="background: #e8f5e8; padding: 15px; border-radius: 6px; border-left: 4px solid #4CAF50;">
                                    <h4 style="margin: 0 0 8px 0; color: #2E7D32;">✅ Online anonymisiert:</h4>
                                    <ul style="margin: 0; padding-left: 15px; font-size: 13px; color: #666;">
                                        <li>Name = Erste 8 UUID-Stellen</li>
                                        <li>Nur Altersgruppe (18-21 / 21+)</li>
                                        <li>Verschlüsselte Referenzen</li>
                                        <li>Kontostand & Limits</li>
                                        <li>Anonymisierte Metadaten</li>
                                        <li>Keine Rückschlüsse möglich</li>
                                    </ul>
                                </div>
                            </div>
                            
                            <div style="background: #fce4ec; border: 1px solid #E91E63; border-radius: 6px; padding: 12px; margin-top: 15px;">
                                <p style="margin: 0; font-size: 13px; color: #AD1457;">
                                    <strong>🔐 Verschlüsselungs-Prinzip:</strong> Echte Daten bleiben lokal - Online nur anonymisierte UUID-Referenzen ohne Entschlüsselungs-Schlüssel.
                                </p>
                            </div>
                        </div>
                        
                        <!-- cannaUNITY Meta-Felder -->
                        <div class="cannaunity-card">
                            <h2>🌿 cannaUNITY Meta-Felder</h2>
                            <p style="margin-bottom: 15px; color: #666;">Das Plugin erkennt automatisch diese von Django erstellten Meta-Felder:</p>
                            
                            <div class="cannaunity-meta-field">
                                <strong>kontostand</strong>
                                <p style="margin: 5px 0 0 0; font-size: 13px; color: #666;">Hauptkontostand in Euro</p>
                            </div>
                            
                            <div class="cannaunity-meta-field">
                                <strong>monatsbeitrag</strong>
                                <p style="margin: 5px 0 0 0; font-size: 13px; color: #666;">Monatsbeitrag in Euro</p>
                            </div>
                            
                            <div class="cannaunity-meta-field">
                                <strong>thc_limit</strong>
                                <p style="margin: 5px 0 0 0; font-size: 13px; color: #666;">THC-Limit in Prozent</p>
                            </div>
                            
                            <div class="cannaunity-meta-field">
                                <strong>daily_limit</strong>
                                <p style="margin: 5px 0 0 0; font-size: 13px; color: #666;">Tageslimit in Gramm</p>
                            </div>
                            
                            <div class="cannaunity-meta-field">
                                <strong>monthly_limit</strong>
                                <p style="margin: 5px 0 0 0; font-size: 13px; color: #666;">Monatslimit in Gramm</p>
                            </div>
                            
                            <div class="cannaunity-meta-field">
                                <strong>koerperliche_einschraenkungen</strong>
                                <p style="margin: 5px 0 0 0; font-size: 13px; color: #666;">Körperliche Einschränkungen</p>
                            </div>
                            
                            <div class="cannaunity-meta-field">
                                <strong>geistliche_einschraenkungen</strong>
                                <p style="margin: 5px 0 0 0; font-size: 13px; color: #666;">Geistige Einschränkungen</p>
                            </div>
                            
                            <div class="cannaunity-meta-field">
                                <strong>pflichtstunden</strong>
                                <p style="margin: 5px 0 0 0; font-size: 13px; color: #666;">Pflichtstunden</p>
                            </div>
                        </div>
                        
                        <!-- Plugin-Information -->
                        <div class="cannaunity-card">
                            <h2>ℹ️ Plugin-Information</h2>
                            <div style="display: flex; flex-direction: column; gap: 10px;">
                                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee;">
                                    <strong>Version:</strong>
                                    <span class="cannaunity-info-badge">1.2.0</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee;">
                                    <strong>Entwickler:</strong>
                                    <span style="color: #2E7D32;">Sascha Dämgen IT and More</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee;">
                                    <strong>Für:</strong>
                                    <span style="color: #4CAF50;">cannaUNITY Community</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; padding: 8px 0;">
                                    <strong>Support:</strong>
                                    <a href="https://cannaunity.de" target="_blank" style="color: #2E7D32; text-decoration: none;">cannaunity.de</a>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Quick Actions -->
                        <div class="cannaunity-card">
                            <h2>🚀 Quick Actions</h2>
                            <div style="display: flex; flex-direction: column; gap: 10px;">
                                <button type="button" class="button button-secondary" onclick="navigator.clipboard.writeText('[user_balance]')" style="width: 100%;">
                                    📋 [user_balance] kopieren
                                </button>
                                <button type="button" class="button button-secondary" onclick="navigator.clipboard.writeText('[user_dashboard]')" style="width: 100%;">
                                    📋 [user_dashboard] kopieren
                                </button>
                                <button type="button" class="button button-primary" onclick="window.open('https://cannaunity.de', '_blank')" style="width: 100%;">
                                    🌐 Support kontaktieren
                                </button>
                            </div>
                        </div>
                        
                    </div>
                    
                </div>
            </div>
        </div>
        
        <script>
        document.addEventListener('DOMContentLoaded', function() {
            // Smooth scroll für bessere UX
            const buttons = document.querySelectorAll('.button');
            buttons.forEach(button => {
                button.addEventListener('click', function() {
                    if (this.textContent.includes('kopieren')) {
                        this.textContent = '✅ Kopiert!';
                        setTimeout(() => {
                            this.textContent = this.textContent.replace('✅ Kopiert!', '📋 ' + this.textContent.split('📋 ')[1]);
                        }, 2000);
                    }
                });
            });
        });
        </script>
        <?php
    }
    
    // Plugin-Aktivierung
    public function activate() {
        add_option('cannaunity_balance_version', '1.2.0');
        add_option('cannaunity_balance_activated', current_time('mysql'));
        
        // Flush rewrite rules
        flush_rewrite_rules();
    }
    
    // Plugin-Deaktivierung
    public function deactivate() {
        // Cleanup falls nötig - aber Daten behalten
        flush_rewrite_rules();
    }
}

// Plugin initialisieren
new CannaUnityBalancePlugin();

// Widget-Support
class CannaUnityBalanceWidget extends WP_Widget {
    
    public function __construct() {
        parent::__construct(
            'cannaunity_balance_widget',
            '🌿 cannaUNITY Balance Widget',
            array('description' => 'Zeigt den Kontostand des eingeloggten cannaUNITY-Mitglieds')
        );
    }
    
    public function widget($args, $instance) {
        echo $args['before_widget'];
        
        if (!empty($instance['title'])) {
            echo $args['before_title'] . apply_filters('widget_title', $instance['title']) . $args['after_title'];
        }
        
        if (is_user_logged_in()) {
            $user_id = get_current_user_id();
            $balance = get_user_meta($user_id, 'kontostand', true);
            echo '<div class="cannaunity-balance-container">';
            echo '<div style="text-align: center; padding: 15px; background: linear-gradient(135deg, #4CAF50, #66BB6A); color: white; border-radius: 8px;">';
            echo '<div style="font-size: 0.9em; margin-bottom: 5px;">🌿 Kontostand</div>';
            echo '<div style="font-size: 1.5em; font-weight: bold;">' . number_format($balance ?: 0, 2, ',', '.') . ' €</div>';
            echo '</div>';
            echo '</div>';
        } else {
            echo '<div class="cannaunity-login-required">';
            echo '<p style="text-align: center; margin: 0;">🌿 Bitte einloggen</p>';
            echo '</div>';
        }
        
        echo $args['after_widget'];
    }
    
    public function form($instance) {
        $title = !empty($instance['title']) ? $instance['title'] : '🌿 Mein cannaUNITY Kontostand';
        ?>
        <p>
            <label for="<?php echo $this->get_field_id('title'); ?>">Titel:</label>
            <input class="widefat" id="<?php echo $this->get_field_id('title'); ?>" 
                   name="<?php echo $this->get_field_name('title'); ?>" type="text" 
                   value="<?php echo esc_attr($title); ?>">
        </p>
        <?php
    }
    
    public function update($new_instance, $old_instance) {
        $instance = array();
        $instance['title'] = (!empty($new_instance['title'])) ? strip_tags($new_instance['title']) : '';
        return $instance;
    }
}

// Widget registrieren
function register_cannaunity_balance_widget() {
    register_widget('CannaUnityBalanceWidget');
}
add_action('widgets_init', 'register_cannaunity_balance_widget');

?>