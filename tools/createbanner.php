<?php
header("Access-Control-Allow-Origin: *");

$displayImg = true;


if($displayImg)
  header('Content-type: image/png');

$font         = realpath('./muli.ttf');

//Will always be included
$imgurl           = $_GET['image'];
$verticalAlign    = $_GET['verticalAlign'];
$horizontalAlign  = $_GET['horizontalAlign'];
$titleSpacing     = $_GET['titleSpacing'];

//Default Values
$title        = '';
$subtitle     = '';
$displayGrid  = false;
$titleSize    = 30;
$subtitleSize = 17;

$logo         = null;
$logoX        = 0;
$logoY        = 0;
$logoWidth    = 300;

$color        = '000000';
$textAlign    = 'center';
$offsetX      = 0;
$offsetY      = 0;

$shadowEnabled  = false;
$shadowColor  = '333333';
$shadowOffsetX = 1;
$shadowOffsetY = 1;
$shadowBlur    = 5;

//Get Values
if(isset($_GET['displayGrid']))   $displayGrid = $_GET['displayGrid'];
if(isset($_GET['title']))         $title    = $_GET['title'];
if(isset($_GET['subtitle']))      $subtitle = $_GET['subtitle'];
if(isset($_GET['titleSize']))     $titleSize    = $_GET['titleSize'];
if(isset($_GET['subtitleSize']))  $subtitleSize = $_GET['subtitleSize'];

if(isset($_GET['logo']))          $logo = $_GET['logo'];
if(isset($_GET['logoX']))         $logoX = $_GET['logoX'];
if(isset($_GET['logoY']))         $logoY = $_GET['logoY'];
if(isset($_GET['logoWidth']))     $logoWidth = $_GET['logoWidth'];

if(isset($_GET['color']))         $color = $_GET['color'];
if(isset($_GET['textAlign']))     $textAlign = $_GET['textAlign'];
if(isset($_GET['offsetX']))       $offsetX = $_GET['offsetX'];
if(isset($_GET['offsetY']))       $offsetY = $_GET['offsetY'];

if(isset($_GET['shadowEnabled'])) $shadowEnabled = $_GET['shadowEnabled'];
if(isset($_GET['shadowColor']))   $shadowColor = $_GET['shadowColor'];
if(isset($_GET['shadowOffsetX'])) $shadowOffsetX = $_GET['shadowOffsetX'];
if(isset($_GET['shadowOffsetY'])) $shadowOffsetY = $_GET['shadowOffsetY'];
if(isset($_GET['shadowBlur']))    $shadowBlur = $_GET['shadowBlur'];

//Resize the banner image to 800px width
$img          = getImage($imgurl);
$img          = imagescale($img, 800);
$img          = cropAlign($img, 800, min(imagesy($img), 225), $horizontalAlign, $verticalAlign);
$imgSize      = array(imagesx($img), imagesy($img));

//Get the colors
$shadowColor = hexColorAllocate($img, $shadowColor);
$color = hexColorAllocate($img, $color);

//If logo was provided - add the logo
if($logo != null){
  $logo = getImage($logo);
  $logo = imagescale($logo, $logoWidth);
  imagecopyresampled($img, $logo, $logoX, $logoY, 0, 0, $logoWidth, imagesy($logo), imagesx($logo), imagesy($logo));
}

//Get text horizontal position
if($textAlign == 'left'){
  $titlePosX = $subtitlePosX = $offsetX;
}
else if($textAlign == 'right'){
  $titlePosX = $imgSize[0] - getWidth($titleSize, $font, $title) - $offsetX;
  $subtitlePosX = $imgSize[0] - getWidth($subtitleSize, $font, $subtitle) - $offsetX;
}
else{
  $titlePosX = $imgSize[0]/2 - getWidth($titleSize, $font, $title)/2 + $offsetX;
  $subtitlePosX = $imgSize[0]/2 - getWidth($subtitleSize, $font, $subtitle)/2 + $offsetX;
}

//Get text vertical position
$totalTitleHeight = getHeight($titleSize, $font, $title) + getHeight($subtitleSize, $font, $subtitle)+$titleSpacing/2;

$titlePosY = ($imgSize[1]/2)-($totalTitleHeight/2) +  getHeight($titleSize, $font, $title)/2+$offsetY;
$subtitlePosY = $titlePosY + getHeight($subtitleSize, $font, $subtitle)+$titleSpacing;

//Write the title - include shadow if enabled
if($shadowEnabled)
  imagettftextblur($img, $titleSize, 0, $titlePosX + $shadowOffsetX, $titlePosY + $shadowOffsetY, $shadowColor,$font,$title, $shadowBlur);
imagettftextblur($img, $titleSize, 0, $titlePosX, $titlePosY, $color, $font, $title);

//Write the subtitle - include shadow if enabled
if($shadowEnabled)
  imagettftextblur($img, $subtitleSize, 0, $subtitlePosX + $shadowOffsetX, $subtitlePosY + $shadowOffsetY, $shadowColor, $font, $subtitle, $shadowBlur);
imagettftextblur($img, $subtitleSize, 0, $subtitlePosX, $subtitlePosY, $color, $font, $subtitle);

//Show a grid on the image if enabled
if($displayGrid == true){
  $gray = imagecolorallocate($img, 170, 170, 170);
  //                  X1                  Y1                X2              Y2
  imageline($img,   0,                $imgSize[1]/2,    $imgSize[0],      $imgSize[1]/2,    $gray); //Horizontal
  imageline($img,   0,                $imgSize[1]/4,    $imgSize[0],      $imgSize[1]/4,    $gray); //Horizontal
  imageline($img,   0,                $imgSize[1]/4*3,  $imgSize[0],      $imgSize[1]/4*3,  $gray); //Horizontal
  imageline($img,   $imgSize[0]/2,    0,                $imgSize[0]/2,    $imgSize[1],    $gray); //Vertical
  imageline($img,   $imgSize[0]/4,    0,                $imgSize[0]/4,    $imgSize[1],    $gray); //Vertical
  imageline($img,   $imgSize[0]/4*3,  0,                $imgSize[0]/4*3,  $imgSize[1],    $gray); //Vertical
}

// Output the image
if($displayImg){
  imagepng($img);
  imagedestroy($img);
}

//Debug
else{
  echo '<p>Image URL: '.$imgurl.'</p>';
  echo '<p>Vertical Align: '.$verticalAlign.'</p>';
  echo '<p>Horizontal Align: '.$horizontalAlign.'</p>';
  echo '<p>Text Align: '.$textAlign.'</p>';
  echo '<p>Offset X: '.$offsetX.'</p>';
  echo '<p>Offset Y:'.$offsetY.'</p>';
  echo '<p>Text Color: '.$color.'</p>';
  echo '<p>Shadow Color: '.$shadowColor.'</p>';
  echo '<p>Title Spacing: '.$titleSpacing.'</p>';
  echo '<p>shadowOffsetX: '.$shadowOffsetX.'</p>';
  echo '<p>shadowOffsetY: '.$shadowOffsetY.'</p>';
  echo '<p>shadowBlur: '.$shadowBlur.'</p>';
}

// Get the width of text
function getWidth($fontSize, $font, $text){
    $box = imageftbbox($fontSize, 0, $font, $text);
    $width = $box[2]-$box[0];
    return $width;
}
//Get the height of text
function getHeight($fontSize, $font, $text){
    $box = imageftbbox($fontSize, 0, $font, $text);
    $height = $box[1]-$box[7];
    return $height;
}
//Change Hex color to RGB
function hexColorAllocate($im,$hex){
    $a = hexdec(substr($hex,0,2));
    $b = hexdec(substr($hex,2,2));
    $c = hexdec(substr($hex,4,2));
    return imagecolorallocate($im, $a, $b, $c);
}
//Align an image and crop if needed
function cropAlign($image, $cropWidth, $cropHeight, $horizontalAlign = 'center', $verticalAlign = 'middle') {
    $width = imagesx($image);
    $height = imagesy($image);
    $horizontalAlignPixels = calculatePixelsForAlign($width, $cropWidth, $horizontalAlign);
    $verticalAlignPixels = calculatePixelsForAlign($height, $cropHeight, $verticalAlign);
    return imageCrop($image, [
        'x' => $horizontalAlignPixels[0],
        'y' => $verticalAlignPixels[0],
        'width' => $horizontalAlignPixels[1],
        'height' => $verticalAlignPixels[1]
    ]);
}
//Calculate pixels needed for cropAlign
function calculatePixelsForAlign($imageSize, $cropSize, $align) {
    switch ($align) {
        case 'left':
        case 'top':
            return [0, min($cropSize, $imageSize)];
        case 'right':
        case 'bottom':
            return [max(0, $imageSize - $cropSize), min($cropSize, $imageSize)];
        case 'center':
        case 'middle':
            return [
                max(0, floor(($imageSize / 2) - ($cropSize / 2))),
                min($cropSize, $imageSize),
            ];
        default: return [0, $imageSize];
    }
}
//Get the image depending on the extension
function getImage($imgurl){
  $extension = strtolower(strrchr($imgurl, '.'));
  if($extension == '.jpg' || $extension == '.jpeg')
    $img = imagecreatefromjpeg($imgurl);
  else
    $img = imagecreatefrompng($imgurl);
  return $img;
}

//Add some blur to the shadow text
function imagettftextblur(&$image,$size,$angle,$x,$y,$color,$fontfile,$text,$blur_intensity = null)
    {
        $blur_intensity = !is_null($blur_intensity) && is_numeric($blur_intensity) ? (int)$blur_intensity : 0;
        if ($blur_intensity > 0)
        {
            $text_shadow_image = imagecreatetruecolor(imagesx($image),imagesy($image));
            imagefill($text_shadow_image,0,0,imagecolorallocate($text_shadow_image,0x00,0x00,0x00));
            imagettftext($text_shadow_image,$size,$angle,$x,$y,imagecolorallocate($text_shadow_image,0xFF,0xFF,0xFF),$fontfile,$text);
            for ($blur = 1;$blur <= $blur_intensity;$blur++)
                imagefilter($text_shadow_image,IMG_FILTER_GAUSSIAN_BLUR);
            for ($x_offset = 0;$x_offset < imagesx($text_shadow_image);$x_offset++)
            {
                for ($y_offset = 0;$y_offset < imagesy($text_shadow_image);$y_offset++)
                {
                    $visibility = (imagecolorat($text_shadow_image,$x_offset,$y_offset) & 0xFF) / 255;
                    if ($visibility > 0)
                        imagesetpixel($image,$x_offset,$y_offset,imagecolorallocatealpha($image,($color >> 16) & 0xFF,($color >> 8) & 0xFF,$color & 0xFF,(1 - $visibility) * 127));
                }
            }
            imagedestroy($text_shadow_image);
        }
        else
            return imagettftext($image,$size,$angle,$x,$y,$color,$fontfile,$text);
    }
?>
