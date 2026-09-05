const uploadToImgBB = async (buffer) => {
  try {
    if (!buffer) {
      throw new Error("Image buffer is required");
    }

    if (!process.env.IMGBB_API_KEY) {
      throw new Error("IMGBB_API_KEY is not configured");
    }

    const base64Image = buffer.toString("base64");

    const formData = new URLSearchParams();

    formData.append("key", process.env.IMGBB_API_KEY);
    formData.append("image", base64Image);

    const response = await fetch(
      "https://api.imgbb.com/1/upload",
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      console.error("ImgBB upload error:", data);

      throw new Error(
        data?.error?.message ||
          "Failed to upload image to ImgBB"
      );
    }

    return {
      url: data.data.url,
      displayUrl: data.data.display_url,
      deleteUrl: data.data.delete_url,
    };
  } catch (error) {
    console.error(
      "❌ ImgBB upload error:",
      error.message
    );

    throw error;
  }
};

export default uploadToImgBB;