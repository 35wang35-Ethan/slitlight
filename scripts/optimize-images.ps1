param(
  [string]$ImageDirectory = "assets/images"
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$jpegCodec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
  Where-Object { $_.MimeType -eq "image/jpeg" }

function Export-OptimizedJpeg {
  param(
    [Parameter(Mandatory)] [string]$Source,
    [Parameter(Mandatory)] [string]$Destination,
    [Parameter(Mandatory)] [int]$MaximumWidth,
    [Parameter(Mandatory)] [long]$Quality
  )

  $sourceImage = [System.Drawing.Image]::FromFile($Source)
  try {
    $scale = [Math]::Min(1.0, [double]$MaximumWidth / [double]$sourceImage.Width)
    $width = [Math]::Max(1, [int][Math]::Round($sourceImage.Width * $scale))
    $height = [Math]::Max(1, [int][Math]::Round($sourceImage.Height * $scale))
    $bitmap = New-Object System.Drawing.Bitmap($width, $height, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
    try {
      $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
      try {
        $graphics.Clear([System.Drawing.Color]::White)
        $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $graphics.DrawImage($sourceImage, 0, 0, $width, $height)
      }
      finally {
        $graphics.Dispose()
      }

      $qualityEncoder = [System.Drawing.Imaging.Encoder]::Quality
      $encoderParameters = New-Object System.Drawing.Imaging.EncoderParameters(1)
      try {
        $encoderParameters.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter($qualityEncoder, $Quality)
        $bitmap.Save($Destination, $jpegCodec, $encoderParameters)
      }
      finally {
        $encoderParameters.Dispose()
      }
    }
    finally {
      $bitmap.Dispose()
    }
  }
  finally {
    $sourceImage.Dispose()
  }
}

$sourceFiles = Get-ChildItem -LiteralPath $ImageDirectory -Filter "*.png"
foreach ($sourceFile in $sourceFiles) {
  $baseName = [System.IO.Path]::GetFileNameWithoutExtension($sourceFile.Name)
  Export-OptimizedJpeg -Source $sourceFile.FullName -Destination (Join-Path $sourceFile.DirectoryName "$baseName.jpg") -MaximumWidth 1920 -Quality 84
  Export-OptimizedJpeg -Source $sourceFile.FullName -Destination (Join-Path $sourceFile.DirectoryName "$baseName-768.jpg") -MaximumWidth 768 -Quality 80
}

Get-ChildItem -LiteralPath $ImageDirectory -Filter "*.jpg" |
  Sort-Object Name |
  Select-Object Name, Length
