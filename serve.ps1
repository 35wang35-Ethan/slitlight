$root = (Resolve-Path $PSScriptRoot).Path
$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add('http://127.0.0.1:8080/')
$listener.Start()
$types = @{ '.html'='text/html; charset=utf-8'; '.css'='text/css'; '.js'='application/javascript'; '.png'='image/png'; '.svg'='image/svg+xml' }
while ($listener.IsListening) {
  $context = $listener.GetContext()
  $relative = $context.Request.Url.AbsolutePath.TrimStart('/')
  if (-not $relative) { $relative = 'index.html' }
  $target = [IO.Path]::GetFullPath((Join-Path $root $relative))
  if ($target.StartsWith($root) -and (Test-Path -LiteralPath $target -PathType Leaf)) {
    $bytes = [IO.File]::ReadAllBytes($target)
    $context.Response.ContentType = $types[[IO.Path]::GetExtension($target)]
    $context.Response.StatusCode = 200
    $context.Response.OutputStream.Write($bytes, 0, $bytes.Length)
  } else { $context.Response.StatusCode = 404 }
  $context.Response.Close()
}
