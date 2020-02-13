const Jimp = require('jimp');
const tf = require('@tensorflow/tfjs');
const tfn = require('@tensorflow/tfjs-node');

const augmentRate = 10;
const augmentChance = 0.5;
const flipChance = 0.5;
const cropSideChance = 0.5;

const maxCrop = 0.2;
const maxRotation = 45;
const maxBrighten = 0.5;
const maxBlur = 3;

async function augmentImages(imagePaths) {
    if (!imagePaths) return;

    try {
        const jimpImages = await Promise.all(imagePaths.map(async imagePath => await Jimp.read(imagePath)));
        const augmentedImages = [];

        jimpImages.forEach(original => {
            augmentedImages.push(original);

            for (let i = 0; i < (augmentRate - 1); ++i) {
                const image = original.clone();

                const crop = getRandomCrop(image, maxCrop, cropSideChance);
                const rotation = (Math.random() * maxRotation * 2) - maxRotation;
                const brightness = (Math.random() * maxBrighten * 2) - maxBrighten;
                const blur = Math.ceil(Math.random() * maxBlur);

                if (Math.random() < augmentChance) image.crop(crop.x, crop.y, crop.width, crop.height);
                if (Math.random() < augmentChance) image.flip(Math.random() < flipChance, Math.random() < flipChance);
                if (Math.random() < augmentChance) image.rotate(rotation, false);
                if (Math.random() < augmentChance) image.brightness(brightness);
                if (Math.random() < augmentChance) image.blur(blur);

                augmentedImages.push(image);
            }
        });

        return jimpsToTensors(augmentedImages);

    } catch (err) {
        console.log(err);
    }
}

function getRandomCrop(image) {
    if (!image) return {};

    const crop = {
        x: 0,
        y: 0,
        width: image.bitmap.width,
        height: image.bitmap.height
    };

    if (Math.random() < cropSideChance) {
        crop.x += Math.round(Math.random() * crop.width * maxCrop);
        crop.width -= crop.x;
    }
    if (Math.random() < cropSideChance) {
        crop.y += Math.round(Math.random() * crop.height * maxCrop);
        crop.height -= crop.y;
    }
    if (Math.random() < cropSideChance) crop.width -= Math.round(Math.random() * crop.width * maxCrop);
    if (Math.random() < cropSideChance) crop.height -= Math.round(Math.random() * crop.height * maxCrop);

    return crop;
}

async function jimpsToTensors(images) {
    return await Promise.all(images.map(async image => {
        const buffer = await image.getBufferAsync(Jimp.MIME_JPEG);
        return tfn.node.decodeJpeg(buffer, 3);
    }));
}

module.exports = augmentImages;