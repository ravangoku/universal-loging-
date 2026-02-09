import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Random;

/**
 * Universal Logging System - Java Logging Service
 * Simulates multiple server logs and sends them to the Python API
 */
public class LoggingService {
    
    // Configuration
    private static final String API_BASE_URL = "http://localhost:5000";
    private static final String LOGS_ENDPOINT = "/api/logs";
    private static final int LOG_INTERVAL = 2000; // milliseconds
    private static final int TOTAL_LOGS = 50; // Total logs to send
    
    // Log levels
    private static final String[] LOG_LEVELS = {"INFO", "WARNING", "ERROR"};
    
    // Sample log sources
    private static final String[] LOG_SOURCES = {
        "AuthService",
        "DatabaseService",
        "APIGateway",
        "CacheService",
        "NotificationService",
        "UserService",
        "AnalyticsService"
    };
    
    // Sample log messages
    private static final String[][] LOG_MESSAGES = {
        {
            "User authentication successful",
            "Session token generated",
            "Login attempt from new device",
            "Token refresh completed",
            "User registration processed"
        },
        {
            "Database connection pool running at 80% capacity",
            "Query execution time exceeded threshold",
            "Connection timeout detected",
            "Slow query logged",
            "Index rebuild scheduled"
        },
        {
            "Request routed to service instance",
            "Rate limit threshold approaching",
            "API version deprecated",
            "Load balanced across 3 instances",
            "Circuit breaker opened for service"
        },
        {
            "Cache hit ratio: 92%",
            "Cache invalidation triggered",
            "Memory usage: 65%",
            "Cache synchronization completed",
            "Eviction policy applied"
        },
        {
            "Email notification sent successfully",
            "SMS delivery confirmed",
            "Push notification queued",
            "Failed notification retry scheduled",
            "Notification batch processed"
        },
        {
            "User profile updated",
            "Preference settings changed",
            "Password reset initiated",
            "User deactivation requested",
            "Account migration started"
        },
        {
            "Event tracked successfully",
            "User session duration: 3600s",
            "Conversion event recorded",
            "Analytics batch job running",
            "Real-time metrics updated"
        }
    };
    
    // Possible errors
    private static final String[] ERROR_MESSAGES = {
        "Connection timeout",
        "Service unavailable",
        "Database error: Connection refused",
        "Invalid authentication token",
        "Request validation failed",
        "Internal server error",
        "Resource not found",
        "Permission denied"
    };
    
    // Possible warnings
    private static final String[] WARNING_MESSAGES = {
        "High CPU usage detected",
        "Memory usage approaching limit",
        "Network latency elevated",
        "Database connection slow",
        "Cache miss rate high",
        "Deprecated API endpoint used",
        "SSL certificate expiring soon"
    };
    
    private static Random random = new Random();
    
    /**
     * Main entry point
     */
    public static void main(String[] args) {
        System.out.println("═".repeat(70));
        System.out.println("Universal Logging System - Java Logging Service");
        System.out.println("═".repeat(70));
        System.out.println("API Endpoint: " + API_BASE_URL + LOGS_ENDPOINT);
        System.out.println("Generating and sending " + TOTAL_LOGS + " simulated logs...");
        System.out.println("═".repeat(70));
        
        // Send logs to API
        sendLogsToAPI();
        
        System.out.println("\n" + "═".repeat(70));
        System.out.println("All logs sent successfully!");
        System.out.println("Check the dashboard to view the logs.");
        System.out.println("═".repeat(70));
    }
    
    /**
     * Send simulated logs to the Python API
     */
    private static void sendLogsToAPI() {
        LogGenerator logGenerator = new LogGenerator();
        
        for (int i = 1; i <= TOTAL_LOGS; i++) {
            // Generate random log
            LogEntry logEntry = logGenerator.generateRandomLog();
            
            // Send to API
            sendLogToAPI(logEntry);
            
            // Print progress
            System.out.println(String.format(
                "[%d/%d] Sent: [%s] %s - %s",
                i,
                TOTAL_LOGS,
                logEntry.getLevel(),
                logEntry.getSource(),
                logEntry.getMessage().substring(0, Math.min(40, logEntry.getMessage().length())) + "..."
            ));
            
            // Wait before sending next log (simulating real-time log generation)
            try {
                Thread.sleep(LOG_INTERVAL);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                System.err.println("Log sending interrupted: " + e.getMessage());
                break;
            }
        }
    }
    
    /**
     * Send a single log entry to the API
     */
    private static void sendLogToAPI(LogEntry logEntry) {
        try {
            // Create JSON payload
            String jsonPayload = String.format(
                "{\"level\":\"%s\",\"message\":\"%s\",\"source\":\"%s\"}",
                escapeJson(logEntry.getLevel()),
                escapeJson(logEntry.getMessage()),
                escapeJson(logEntry.getSource())
            );
            
            // Create HTTP connection
            URL url = new URL(API_BASE_URL + LOGS_ENDPOINT);
            HttpURLConnection connection = (HttpURLConnection) url.openConnection();
            connection.setRequestMethod("POST");
            connection.setRequestProperty("Content-Type", "application/json");
            connection.setDoOutput(true);
            
            // Send request
            try (OutputStream os = connection.getOutputStream()) {
                byte[] input = jsonPayload.getBytes(StandardCharsets.UTF_8);
                os.write(input, 0, input.length);
            }
            
            // Check response
            int responseCode = connection.getResponseCode();
            if (responseCode != 201 && responseCode != 200) {
                System.err.println("Error: API returned status code " + responseCode);
            }
            
            connection.disconnect();
        } catch (Exception e) {
            System.err.println("Error sending log to API: " + e.getMessage());
        }
    }
    
    /**
     * Escape special characters for JSON
     */
    private static String escapeJson(String text) {
        return text
            .replace("\\", "\\\\")
            .replace("\"", "\\\"")
            .replace("\n", "\\n")
            .replace("\r", "\\r")
            .replace("\t", "\\t");
    }
    
    /**
     * Inner class to generate random log entries
     */
    static class LogGenerator {
        private Random random = new Random();
        
        /**
         * Generate a random log entry
         */
        public LogEntry generateRandomLog() {
            String level = selectRandomly(LOG_LEVELS);
            String source = selectRandomly(LOG_SOURCES);
            String message = generateLogMessage(level, source);
            
            return new LogEntry(level, message, source);
        }
        
        /**
         * Generate log message based on level
         */
        private String generateLogMessage(String level, String source) {
            if ("ERROR".equals(level)) {
                return selectRandomly(ERROR_MESSAGES);
            } else if ("WARNING".equals(level)) {
                return selectRandomly(WARNING_MESSAGES);
            } else {
                // INFO level
                int sourceIndex = java.util.Arrays.asList(LOG_SOURCES).indexOf(source);
                return selectRandomly(LOG_MESSAGES[sourceIndex]);
            }
        }
        
        /**
         * Select random element from array
         */
        private String selectRandomly(String[] array) {
            return array[random.nextInt(array.length)];
        }
    }
    
    /**
     * Inner class representing a log entry
     */
    static class LogEntry {
        private String level;
        private String message;
        private String source;
        private String timestamp;
        
        public LogEntry(String level, String message, String source) {
            this.level = level;
            this.message = message;
            this.source = source;
            this.timestamp = LocalDateTime.now().format(DateTimeFormatter.ISO_DATE_TIME);
        }
        
        public String getLevel() {
            return level;
        }
        
        public String getMessage() {
            return message;
        }
        
        public String getSource() {
            return source;
        }
        
        public String getTimestamp() {
            return timestamp;
        }
    }
}
