export function hexToText(hexString: string) {
    let resultText = '';
    for (let n = 0; n < hexString.length; n += 2) {
        resultText += String.fromCharCode(parseInt(hexString.substring(n, n+2), 16));
    }
    return resultText
}