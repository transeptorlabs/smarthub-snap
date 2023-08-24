export const handleCopyToClipboard = (event: any, text: string) => {
    event.preventDefault();
    if (text) {
      navigator.clipboard.writeText(text);    
    }
}