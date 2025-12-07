interface Model3DViewerProps {
  url: string;
}

export default function Model3DViewer({ url }: Model3DViewerProps) {
  // Create an inline HTML document that loads model-viewer from CDN
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <script type="module" src="https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js"></script>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          html, body { width: 100%; height: 100%; background: transparent; overflow: hidden; }
          model-viewer {
            width: 100%;
            height: 100%;
            background: linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%);
            --poster-color: transparent;
          }
        </style>
      </head>
      <body>
        <model-viewer
          src="${url}"
          alt="3D модель"
          auto-rotate
          camera-controls
          shadow-intensity="1"
          exposure="0.8"
          loading="eager"
        ></model-viewer>
      </body>
    </html>
  `;

  const blob = new Blob([htmlContent], { type: 'text/html' });
  const iframeSrc = URL.createObjectURL(blob);

  return (
    <iframe
      src={iframeSrc}
      className="w-full h-full border-0 rounded-lg"
      title="3D Model Viewer"
      allow="autoplay; fullscreen; xr-spatial-tracking"
    />
  );
}
