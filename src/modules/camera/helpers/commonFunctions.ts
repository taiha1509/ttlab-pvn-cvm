// function to return name of the kinesis's signalling channel
export function generateKinesisChannelName(createCameraDto) {
    return `Signaling-TokyoTechLab-${createCameraDto.uid}`;
}
