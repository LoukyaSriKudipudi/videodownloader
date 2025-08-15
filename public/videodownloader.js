const videoDownloaderForm = document.getElementById("videoDownloaderForm");
const inputURL = document.querySelector(".inputURL");
const DownloadStatus = document.getElementById("DownloadStatus");
const downloadOptions = document.getElementById("downloadOptions"); // checkbox

videoDownloaderForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const url = inputURL.value;
  const audioonly = downloadOptions.checked; // fixed

  DownloadStatus.textContent = "Downloading...";

  try {
    const res = await fetch("/download", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, audioonly }),
    });

    const data = await res.json();
    if (data.message) {
      DownloadStatus.textContent = `${data.message}\n`;

      const a = document.createElement("a");
      a.href = "https://t.me/loukyaecho";
      a.textContent = "Go to Telegram group";
      DownloadStatus.append(a);
    }
  } catch (err) {
    console.error(err);
    DownloadStatus.textContent = "Error downloading video";
  }
});
