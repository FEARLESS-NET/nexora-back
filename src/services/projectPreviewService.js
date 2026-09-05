import puppeteer from "puppeteer";

const normalizeUrl = (url) => {
  if (!url) return "";

  const trimmed = url.trim();

  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://")
  ) {
    return trimmed;
  }

  return `https://${trimmed}`;
};

export const generateProjectPreview = async (liveUrl) => {
  if (!liveUrl) {
    return "";
  }

  if (!process.env.IMGBB_API_KEY) {
    console.error("IMGBB_API_KEY is missing");
    return "";
  }

  const url = normalizeUrl(liveUrl);

  let browser;

  try {
    console.log("Generating project preview:", url);

    browser = await puppeteer.launch({
      headless: true,

      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
      ],
    });

    const page = await browser.newPage();

    await page.setViewport({
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
    });

    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    await new Promise((resolve) =>
      setTimeout(resolve, 1500)
    );

    const screenshotBuffer = await page.screenshot({
      fullPage: true,
      type: "png",
    });

    await browser.close();
    browser = null;

    const base64Image =
      screenshotBuffer.toString("base64");

    const formData = new FormData();

    formData.append(
      "key",
      process.env.IMGBB_API_KEY
    );

    formData.append(
      "image",
      base64Image
    );

    const response = await fetch(
      "https://api.imgbb.com/1/upload",
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      console.error(
        "ImgBB upload failed:",
        data
      );

      return "";
    }

    const imageUrl =
      data.data?.display_url ||
      data.data?.url ||
      "";

    console.log(
      "Preview uploaded successfully:",
      imageUrl
    );

    return imageUrl;
  } catch (error) {
    console.error(
      "Project preview error:",
      error.message
    );

    return "";
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};