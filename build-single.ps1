Add-Type -AssemblyName System.Drawing
$root = $PSScriptRoot
$source = [Drawing.Image]::FromFile((Join-Path $root 'assets\hero.png'))
$canvas = [Drawing.Bitmap]::new(1280, 720)
$graphics = [Drawing.Graphics]::FromImage($canvas)
$graphics.InterpolationMode = [Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$graphics.DrawImage($source, 0, 0, 1280, 720)
$codec = [Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object MimeType -eq 'image/jpeg'
$parameters = [Drawing.Imaging.EncoderParameters]::new(1)
$parameters.Param[0] = [Drawing.Imaging.EncoderParameter]::new([Drawing.Imaging.Encoder]::Quality, 76L)
$jpgPath = Join-Path $root 'assets\hero-web.jpg'
$canvas.Save($jpgPath, $codec, $parameters)
$graphics.Dispose(); $canvas.Dispose(); $source.Dispose()
$hero = [Convert]::ToBase64String([IO.File]::ReadAllBytes($jpgPath))
$css = [IO.File]::ReadAllText((Join-Path $root 'style.css')).Replace("url('assets/hero.png')", "url('data:image/jpeg;base64,$hero')")
$js = [IO.File]::ReadAllText((Join-Path $root 'app.js'))
$html = [IO.File]::ReadAllText((Join-Path $root 'index.html'))
$html = $html.Replace('<link rel="stylesheet" href="style.css">', "<style>$css</style>")
$html = $html.Replace('<script src="app.js"></script>', "<script>$js</script>")
[IO.File]::WriteAllText((Join-Path $root 'github-index.html'), $html, [Text.UTF8Encoding]::new($false))
