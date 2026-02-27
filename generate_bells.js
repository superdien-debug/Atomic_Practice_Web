const fs = require('fs');

function writeWav(filename, frequency, duration, sampleRate = 44100) {
    const numSamples = duration * sampleRate;
    const buffer = Buffer.alloc(44 + numSamples * 2);

    // RIFF chunk descriptor
    buffer.write('RIFF', 0);
    buffer.writeUInt32LE(36 + numSamples * 2, 4); // Chunk size
    buffer.write('WAVE', 8);

    // fmt sub-chunk
    buffer.write('fmt ', 12);
    buffer.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
    buffer.writeUInt16LE(1, 20); // AudioFormat (1 for PCM)
    buffer.writeUInt16LE(1, 22); // NumChannels (1 for mono)
    buffer.writeUInt32LE(sampleRate, 24); // SampleRate
    buffer.writeUInt32LE(sampleRate * 2, 28); // ByteRate
    buffer.writeUInt16LE(2, 32); // BlockAlign
    buffer.writeUInt16LE(16, 34); // BitsPerSample

    // data sub-chunk
    buffer.write('data', 36);
    buffer.writeUInt32LE(numSamples * 2, 40);

    // Write audio data (sine wave with exponential decay to make it sound like a bell)
    for (let i = 0; i < numSamples; i++) {
        const time = i / sampleRate;
        const decay = Math.exp(-2.5 * time); // decay factor
        const envelope = time < 0.02 ? time / 0.02 : decay; // quick attack, exponential release

        let sample = Math.sin(2 * Math.PI * frequency * time);
        // Add some harmonics for a bell-like sound
        sample += 0.5 * Math.sin(2 * Math.PI * (frequency * 1.5) * time);
        sample += 0.3 * Math.sin(2 * Math.PI * (frequency * 2) * time);
        sample += 0.1 * Math.sin(2 * Math.PI * (frequency * 3) * time);

        // Normalize and apply envelope
        sample = (sample / 1.9) * envelope;

        // Convert to 16-bit PCM (-32768 to 32767)
        const intSample = Math.max(-32768, Math.min(32767, Math.floor(sample * 32767)));
        buffer.writeInt16LE(intSample, 44 + i * 2);
    }

    fs.writeFileSync(filename, buffer);
    console.log(`Generated ${filename}`);
}

writeWav('assets/music/inhale.wav', 880, 2.0); // A5 note
writeWav('assets/music/exhale.wav', 659.25, 2.0); // E5 note
