// Datei: src/apps/unifi_api_debug/components/DebugLogTable.jsx

import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  CircularProgress,
  Alert,
  Box,
} from "@mui/material";
import axios from "axios";

const DebugLogTable = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rawResponse, setRawResponse] = useState(null);

  useEffect(() => {
    axios
      .get("/api/unifi_api_debug/debug-logs/")
      .then((res) => {
        const data = res.data;
        setRawResponse(data);

        // ✅ Korrekte Extraktion: logs.results
        const entries =
          Array.isArray(data) ? data :
          Array.isArray(data.logs) ? data.logs :
          Array.isArray(data.logs?.results) ? data.logs.results :
          Array.isArray(data.results) ? data.results :
          null;

        if (entries) {
          setLogs(entries);
        } else {
          setError("Antwort enthält kein gültiges Log-Array.");
        }
      })
      .catch((err) => {
        setError("Fehler beim Laden der Logs.");
        console.error(err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <Card className="mt-8">
      <CardContent>
        <Typography variant="h6" gutterBottom>
          NFC-Debug-Log
        </Typography>

        {loading ? (
          <CircularProgress />
        ) : error ? (
          <>
            <Alert severity="error">{error}</Alert>
            {rawResponse && (
              <Box mt={2}>
                <Typography variant="caption" color="text.secondary">
                  Debug-Antwort (raw):
                </Typography>
                <pre className="text-xs">{JSON.stringify(rawResponse, null, 2)}</pre>
              </Box>
            )}
          </>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Zeitstempel</TableCell>
                <TableCell>Token</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Details</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                  <TableCell>{log.token}</TableCell>
                  <TableCell>{log.status}</TableCell>
                  <TableCell>
                    <pre className="whitespace-pre-wrap text-xs">
                      {log.raw_data}
                    </pre>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default DebugLogTable;
