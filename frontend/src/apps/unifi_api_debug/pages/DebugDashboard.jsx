// Datei: src/apps/unifi_api_debug/pages/DebugDashboard.jsx

import React, { useState } from "react";
import { Button, Card, CardContent, Typography, Grid, Paper, Divider, Box } from "@mui/material";
import axios from "axios";
import DebugLogTable from "../components/DebugLogTable";

const DebugDashboard = () => {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const startTest = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/unifi_api_debug/test-nfc-session/");
      setResult(response.data);
    } catch (error) {
      setResult({ success: false, message: "Fehler beim Aufruf der API." });
    }
    setLoading(false);
  };

  return (
    <Box className="p-6">
      <Typography variant="h4" gutterBottom>
        UniFi Access – Native API-Testumgebung
      </Typography>
      <Typography variant="body2" gutterBottom color="text.secondary">
        Diese Umgebung dient der Verifizierung von NFC-Kartenlesevorgängen über die native UniFi Access Developer API.
        Ziel ist die spätere Integration in das Autorisierungssystem zur eindeutigen Zuordnung von Benutzerprofilen anhand von Karten-Tokens.
      </Typography>

      <Grid container spacing={3} className="mt-4">
        <Grid item xs={12} md={5}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Live-Test: Kartenlesung starten
              </Typography>

              <Button
                variant="contained"
                color="primary"
                onClick={startTest}
                disabled={loading}
              >
                {loading ? "Bitte Karte auflegen..." : "TEST JETZT STARTEN"}
              </Button>

              {result && (
                <Box mt={4}>
                  <Divider sx={{ mb: 2 }} />
                  <Typography variant="subtitle2">Testergebnis:</Typography>
                  <Paper variant="outlined" sx={{ p: 2, mt: 1 }}>
                    <pre className="text-sm">
                      {JSON.stringify(result, null, 2)}
                    </pre>
                  </Paper>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={7}>
          <DebugLogTable />
        </Grid>
      </Grid>
    </Box>
  );
};

export default DebugDashboard;
