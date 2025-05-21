# MUI v7 Migrations-Leitfaden für cannaUNITY

## 1. Das Hauptproblem: Grid-Komponenten

MUI v7 hat das Grid-System grundlegend überarbeitet:

**Alter Ansatz (MUI v5):** `<Grid item xs={12} md={6}>`
- Verwendet `item` Prop und separate Breakpoint-Props (`xs`, `sm`, `md`, etc.)

**Neuer Ansatz (MUI v7):** `<Grid size={{ xs: 12, md: 6 }}>`
- Verwendet ein konsolidiertes `size`-Prop mit einem Objekt für Breakpoints
- Der `item`-Prop existiert nicht mehr – alle Grids sind implizit Items

## 2. Häufige Fehler und ihre Lösungen

**Problem: `item` Props**
- Lösung: Einfach entfernen
- Beispiel: `<Grid item>` wird zu `<Grid>`

**Problem: Breakpoint-Props**
- Lösung: In `size`-Prop konvertieren
- Beispiel: `xs={12}` wird zu `size={12}` oder `size={{ xs: 12 }}`

**Problem: Mehrere Breakpoints**
- Lösung: Alle in ein `size`-Objekt
- Beispiel: `xs={12} md={6}` wird zu `size={{ xs: 12, md: 6 }}`

**Problem: Container-Breite**
- Lösung: `sx={{ width: '100%' }}` hinzufügen
- Beispiel: `<Grid container>` wird zu `<Grid container sx={{ width: '100%' }}>`

**Problem: Autocomplete key-Prop**
- Lösung: Destrukturieren und explizit übergeben
- Beispiel: `{...props}` wird zu `const { key, ...otherProps } = props;` und dann `key={key} {...otherProps}`

**Problem: Tabs-Problem**
- Lösung: `defaultValue` hinzufügen, versteckte Tabs für Werte
- Beispiel: `value={0}` wird zu `value={0} defaultValue={0}`

## 3. Erkennungsmerkmale im Code

Wenn Sie auf folgende Fehler in der Konsole treffen:
- `MUI Grid: The item prop has been removed and is no longer necessary.`
- `MUI Grid: The xs prop has been removed.` (oder andere Breakpoints)
- `MUI: The value provided to the Tabs component is invalid.`

## 4. Automatisierungsprozess

Für größere Projekte wie cannaUNITY ist der beste Ansatz:

1. Verwenden Sie zuerst das offizielle Codemod:
   ```bash
   npx @mui/codemod v7.0.0/grid-props ./src
   ```

2. Verwenden Sie dann das erweiterte Migrationsskript für die restlichen Probleme:
   ```bash
   npx mui-v7-migrate ./src --fix-tabs --verbose
   ```

3. Suchen Sie nach verbleibenden Warnungen und beheben Sie diese manuell.

## 5. Woran Sie bei der manuellen Migration denken sollten

**5.1 Grid-Container:**
- Immer `sx={{ width: '100%' }}` hinzufügen (sonst haben Container nicht die volle Breite)

**5.2 Mehrere Breakpoints:**
- Alle in ein einziges `size`-Objekt packen: `size={{ xs: 12, sm: 6, md: 4 }}`

**5.3 Autocomplete-Komponenten:**
- Bei `renderOption`-Props auf korrektes Key-Handling achten
- Code-Beispiel:
  ```jsx
  renderOption={(props, option) => {
    const { key, ...otherProps } = props;
    return (
      <MenuItem key={key} {...otherProps}>
        {option.label}
      </MenuItem>
    )
  }}
  ```

**5.4 Tabs-Komponenten:**
- Immer `defaultValue` entsprechend dem `value` setzen
- Sicherstellen, dass für jeden Tab-Wert auch ein entsprechender Tab existiert
- Bei dynamischen Tabs prüfen, ob alle Werte existieren
- Code-Beispiel:
  ```jsx
  <Tabs value={value} defaultValue={value}>
    <Tab value="tab1" label="Tab 1" />
    <Tab value="tab2" label="Tab 2" />
    {/* Versteckter Tab für nicht sichtbare, aber referenzierte Werte */}
    {hiddenTabValue && (
      <Tab value={hiddenTabValue} sx={{ display: 'none' }} />
    )}
  </Tabs>
  ```

## 6. Vollständiges Beispiel: Grid-Migration

**Vor MUI v7:**
```jsx
<Grid container spacing={2}>
  <Grid item xs={12}>
    <Typography variant="h4">Überschrift</Typography>
  </Grid>
  <Grid item xs={12} md={6}>
    <TextField label="Name" fullWidth />
  </Grid>
  <Grid item xs={12} md={6}>
    <TextField label="E-Mail" fullWidth />
  </Grid>
</Grid>
```

**Nach MUI v7:**
```jsx
<Grid container spacing={2} sx={{ width: '100%' }}>
  <Grid size={12}>
    <Typography variant="h4">Überschrift</Typography>
  </Grid>
  <Grid size={{ xs: 12, md: 6 }}>
    <TextField label="Name" fullWidth />
  </Grid>
  <Grid size={{ xs: 12, md: 6 }}>
    <TextField label="E-Mail" fullWidth />
  </Grid>
</Grid>
```

## 7. Besondere Hinweise zur cannaUNITY-Migration

- Die meisten Probleme werden im Kontext der Grid- und Layout-Komponenten auftreten
- Bei komplexen Formularen (wie Seed-Purchase, Room-Management) auf verschachtelte Grid-Komponenten achten
- Die Tabs-Komponenten in IrrigationControllerPage.jsx benötigen besondere Aufmerksamkeit
- Autocomplete-Komponenten mit benutzerdefinierten Optionen-Renderern überprüfen
- Eingebettete MUI-Komponenten in SVG-Visualisierungen oder Charts zusätzlich testen

Für eine vollständige API-Referenz und weitere Details besuchen Sie die [MUI v7 Grid-Dokumentation](https://mui.com/material-ui/migration/upgrade-to-grid-v2/) und die [MUI v7 Release Notes](https://mui.com/material-ui/migration/upgrade-to-v7/).