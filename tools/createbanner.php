<?php
$displayImg = true;

if($displayImg)
  header('Content-Type: image/png');

$font         = realpath('./muli.ttf');
$titleSize    = 30;
$subtitleSize = 17;

$imgurl           = $_GET['image'];
$verticalAlign    = $_GET['verticalAlign'];
$horizontalAlign  = $_GET['horizontalAlign'];
$align            = $_GET['textAlign'];
$horizontalOffset = $_GET['horizontalOffset'];
$verticalOffset   = $_GET['verticalOffset'];
$color            = $_GET['color'];

$img          = imagecreatefromstring(file_get_contents($imgurl))
$img          = imagescale($img, 800);
$img          = cropAlign($img, 800, min(imagesy($img), 225), $horizontalAlign, $verticalAlign);
$imgSize      = array(imagesx($img), imagesy($img));

$title        = "Title Placeholder";
$subtitle     = "Subtitle Placeholder";

if(isset($_GET['title']))     $title    = $_GET['title'];
if(isset($_GET['subtitle']))  $subtitle = $_GET['subtitle'];

$color = hexColorAllocate($img, $color);


if($align == 'left'){
  $titlePosX = $subtitlePosX = $horizontalOffset;
}
else if($align == 'right'){
  $titlePosX = $imgSize[0] - getWidth($titleSize, $font, $title) - $horizontalOffset;
  $subtitlePosX = $imgSize[0] - getWidth($subtitleSize, $font, $subtitle) - $horizontalOffset;
}
else{
  $titlePosX = $imgSize[0]/2 - getWidth($titleSize, $font, $title)/2 + $horizontalOffset;
  $subtitlePosX = $imgSize[0]/2 - getWidth($subtitleSize, $font, $subtitle)/2 + $horizontalOffset;
}

$totalTitleHeight = getHeight($titleSize, $font, $title) + getHeight($subtitleSize, $font, $subtitle);

$titlePosY = ($imgSize[1]/2)-($totalTitleHeight/2) +  getHeight($titleSize, $font, $title)/2+$verticalOffset;
$subtitlePosY = $titlePosY + getHeight($subtitleSize, $font, $subtitle)+10;

imagettftext($img, $titleSize, 0, $titlePosX, $titlePosY, $color, $font, $title);
imagettftext($img, $subtitleSize, 0, $subtitlePosX, $subtitlePosY, $color, $font, $subtitle);

// Output the image
if($displayImg){
  imagepng($img, null, 100);
  imagedestroy($img);
}

function getWidth($fontSize, $font, $text){
    $box = imageftbbox($fontSize, 0, $font, $text);
    $width = $box[2]-$box[0];
    return $width;
}
function getHeight($fontSize, $font, $text){
    $box = imageftbbox($fontSize, 0, $font, $text);
    $height = $box[1]-$box[7];
    return $height;
}
function hexColorAllocate($im,$hex){
    $a = hexdec(substr($hex,0,2));
    $b = hexdec(substr($hex,2,2));
    $c = hexdec(substr($hex,4,2));
    return imagecolorallocate($im, $a, $b, $c);
}
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
?>
