Option Explicit

Dim shell, fileSystem, baseFolder, nodeExe, serverFile
Dim request, isRunning, command, attempt, locator

Set shell = CreateObject("WScript.Shell")
Set fileSystem = CreateObject("Scripting.FileSystemObject")

baseFolder = fileSystem.GetParentFolderName(WScript.ScriptFullName)
serverFile = baseFolder & "\busan-map-server.js"

nodeExe = ""
On Error Resume Next
Set locator = shell.Exec("where node")
If Err.Number = 0 Then nodeExe = Trim(locator.StdOut.ReadLine)
Err.Clear
On Error GoTo 0

If nodeExe = "" Then
  nodeExe = shell.ExpandEnvironmentStrings("%USERPROFILE%") & _
    "\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
End If

If nodeExe = "" Or Not fileSystem.FileExists(nodeExe) Then
  MsgBox "Node.js 18 or newer is required. Install it from https://nodejs.org/", 16, "Busan Convenience Map"
  WScript.Quit 1
End If

If Not fileSystem.FileExists(serverFile) Then
  MsgBox "busan-map-server.js could not be found.", 16, "Busan Convenience Map"
  WScript.Quit 1
End If

isRunning = False
On Error Resume Next
Set request = CreateObject("MSXML2.XMLHTTP")
request.Open "GET", "http://127.0.0.1:3000/", False
request.Send
If Err.Number = 0 Then
  If request.Status = 200 Then isRunning = True
End If
Err.Clear
On Error GoTo 0

If Not isRunning Then
  command = Chr(34) & nodeExe & Chr(34) & " " & _
    Chr(34) & serverFile & Chr(34)
  shell.Run command, 0, False

  For attempt = 1 To 20
    WScript.Sleep 200
    On Error Resume Next
    Set request = CreateObject("MSXML2.XMLHTTP")
    request.Open "GET", "http://127.0.0.1:3000/", False
    request.Send
    If Err.Number = 0 Then
      If request.Status = 200 Then
        isRunning = True
        On Error GoTo 0
        Exit For
      End If
    End If
    Err.Clear
    On Error GoTo 0
  Next
End If

If isRunning Then
  shell.Run "http://127.0.0.1:3000/", 1, False
Else
  MsgBox "The app could not be started.", 16, "Busan Convenience Map"
End If
