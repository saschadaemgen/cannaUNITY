Set WshShell = CreateObject("WScript.Shell")
startupPath = WshShell.SpecialFolders("Startup")
Set FSO = CreateObject("Scripting.FileSystemObject")

vbsPath = startupPath & "\start-listener-hidden.vbs"

If FSO.FileExists(vbsPath) Then
    FSO.DeleteFile vbsPath
    MsgBox "Der cannaUNITY Listener wurde aus dem Autostart entfernt.", vbInformation, "Autostart entfernt"
Else
    MsgBox "Es wurde kein Listener im Autostart gefunden.", vbExclamation, "Hinweis"
End If
