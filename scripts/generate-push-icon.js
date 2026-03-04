const fs = require('fs');
const sharp = require('sharp');
const path = require('path');

async function processIcon() {
    const inputPath = process.argv[2];
    const outputPath = path.join(process.cwd(), 'android/app/src/main/res/drawable/ic_stat_name.png');

    console.log(`Processing ${inputPath}...`);

    // Extract alpha channel and make it white for Android Push Icon
    await sharp(inputPath)
        .resize(96, 96, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .toColorspace('b-w')
        .negate({ alpha: false }) // Make black pixels white
        // For a push icon, the shape must be solid white (alpha channel dictates shape)
        // We will extract the alpha channel and use it as a mask, painting everything white.
        .toBuffer()
        .then(buffer => {
            return sharp(inputPath)
                .resize(96, 96, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
                .extractChannel('alpha')
                .toBuffer()
                .then(alpha => {
                    return sharp(buffer)
                        .composite([{
                            input: Buffer.from('<svg><rect width="96" height="96" fill="#ffffff"/></svg>'),
                            blend: 'in'
                        }])
                        .joinChannel(alpha)
                        .toFile(outputPath);
                });
        });

    console.log('Saved android push icon to:', outputPath);
}

processIcon().catch(console.error);
