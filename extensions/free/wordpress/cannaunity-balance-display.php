<?php
/**
 * Plugin Name: cannaUNITY Balance Display
 * Plugin URI: https://cannaunity.de
 * Description: Zeigt Kontostände und Benutzerinformationen für cannaUNITY-Mitglieder im WordPress Frontend an.
 * Version: 1.0.0
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
        add_shortcode('cannaunity_balance', array($this, 'display_balance_shortcode')); // Alternative
        
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
            '1.0.0'
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
        
        .cannaunity-monthly-limit {
            border-left-color: #2196F3 !important;
        }
        
        .cannaunity-logo {
            width: 30px;
            height: 30px;
            display: inline-block;
            margin-right: 10px;
            vertical-align: middle;
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
        $thc_limit = $this->get_user_meta_safe($user_id, 'thc_limit');
        $monthly_limit = $this->get_user_meta_safe($user_id, 'monthly_limit');
        
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
        
        // Benutzerdaten
        $output .= '<div class="cannaunity-info-card">';
        $output .= '<span class="info-label">👤 Mitgliedsname:</span>';
        $output .= '<span class="info-value">' . esc_html($current_user->display_name) . '</span>';
        $output .= '</div>';
        
        $output .= '<div class="cannaunity-info-card">';
        $output .= '<span class="info-label">📧 E-Mail:</span>';
        $output .= '<span class="info-value">' . esc_html($current_user->user_email) . '</span>';
        $output .= '</div>';
        
        // cannaUNITY Meta-Felder falls vorhanden
        if ($thc_limit) {
            $output .= '<div class="cannaunity-info-card cannaunity-thc-limit">';
            $output .= '<span class="info-label">🌿 THC-Limit:</span>';
            $output .= '<span class="info-value">' . esc_html($thc_limit) . ' g</span>';
            $output .= '</div>';
        }
        
        if ($monthly_limit) {
            $output .= '<div class="cannaunity-info-card cannaunity-monthly-limit">';
            $output .= '<span class="info-label">📅 Monatslimit:</span>';
            $output .= '<span class="info-value">' . esc_html($monthly_limit) . ' g</span>';
            $output .= '</div>';
        }
        
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
        <div class="wrap">
            <h1>🌿 cannaUNITY Balance Display Einstellungen</h1>
            
            <div class="card" style="max-width: none;">
                <h2>Verfügbare Shortcodes</h2>
                <table class="wp-list-table widefat fixed striped">
                    <thead>
                        <tr>
                            <th>Shortcode</th>
                            <th>Beschreibung</th>
                            <th>Verwendung</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><code>[user_balance]</code></td>
                            <td>Zeigt nur den Kontostand</td>
                            <td>Für einzelne Seiten oder Posts</td>
                        </tr>
                        <tr>
                            <td><code>[user_dashboard]</code></td>
                            <td>Vollständiges Mitglieder-Dashboard</td>
                            <td>Für Mitgliederbereich oder Profilseiten</td>
                        </tr>
                        <tr>
                            <td><code>[user_profile]</code></td>
                            <td>Kompakte Profilanzeige</td>
                            <td>Für Widgets oder kleine Bereiche</td>
                        </tr>
                        <tr>
                            <td><code>[cannaunity_balance]</code></td>
                            <td>Alternative zu [user_balance]</td>
                            <td>Für cannaUNITY-spezifische Anwendungen</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            <div class="card">
                <h2>Parameter für [user_balance] und [cannaunity_balance]</h2>
                <table class="wp-list-table widefat fixed striped">
                    <thead>
                        <tr>
                            <th>Parameter</th>
                            <th>Standard</th>
                            <th>Beschreibung</th>
                            <th>Beispiel</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><code>field</code></td>
                            <td>"kontostand"</td>
                            <td>Name des Meta-Feldes</td>
                            <td><code>field="guthaben"</code></td>
                        </tr>
                        <tr>
                            <td><code>currency</code></td>
                            <td>"€"</td>
                            <td>Währungssymbol</td>
                            <td><code>currency="USD"</code></td>
                        </tr>
                        <tr>
                            <td><code>decimals</code></td>
                            <td>"2"</td>
                            <td>Nachkommastellen</td>
                            <td><code>decimals="0"</code></td>
                        </tr>
                        <tr>
                            <td><code>show_label</code></td>
                            <td>"true"</td>
                            <td>Label anzeigen</td>
                            <td><code>show_label="false"</code></td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            <div class="card">
                <h2>Beispiele</h2>
                <h3>Basis-Verwendung:</h3>
                <p><code>[user_balance]</code> - Zeigt Kontostand mit Standard-Einstellungen</p>
                <p><code>[user_dashboard]</code> - Komplettes Dashboard</p>
                
                <h3>Mit benutzerdefinierten Parametern:</h3>
                <p><code>[user_balance currency="USD" decimals="0"]</code> - US-Dollar ohne Nachkommastellen</p>
                <p><code>[cannaunity_balance show_label="false"]</code> - Nur Betrag ohne Label</p>
                <p><code>[user_balance field="mein_guthaben" currency="CHF"]</code> - Anderes Feld in Schweizer Franken</p>
            </div>
            
            <div class="card">
                <h2>cannaUNITY Meta-Felder</h2>
                <p>Das Plugin erkennt automatisch diese von Django erstellten Meta-Felder:</p>
                <ul>
                    <li><strong>kontostand</strong> - Hauptkontostand in Euro</li>
                    <li><strong>thc_limit</strong> - THC-Limit in Gramm</li>
                    <li><strong>monthly_limit</strong> - Monatslimit in Gramm</li>
                </ul>
            </div>
            
            <div class="card">
                <h2>Plugin-Information</h2>
                <p><strong>Version:</strong> 1.0.0</p>
                <p><strong>Entwickler:</strong> Sascha Dämgen IT and More</p>
                <p><strong>Für:</strong> cannaUNITY Community</p>
                <p><strong>Support:</strong> <a href="https://itandmore.de" target="_blank">itandmore.de</a></p>
            </div>
        </div>
        <?php
    }
    
    // Plugin-Aktivierung
    public function activate() {
        add_option('cannaunity_balance_version', '1.0.0');
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