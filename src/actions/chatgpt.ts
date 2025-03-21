"use server";
import { client } from "@/lib/prisma";
import { ContentItem, Slide } from "@/lib/types";
import { currentUser } from "@clerk/nextjs/server";
import OpenAI from "openai";

const token = process.env["OPENAI_API_KEY"];

const openai = new OpenAI({
  baseURL: "https://models.inference.ai.azure.com",
  apiKey: token,
});
export const generateCreativePrompt = async (userPrompt: string) => {
  const openai = new OpenAI({
    baseURL: "https://models.inference.ai.azure.com",
    apiKey: token,
  });
  const finalPrompt = `Create a coherent and relevant outline for the following
    prompt:${userPrompt}.
    The outline should consist of at least 6 points,with each
    point written as a single sentence.
    Ensure the outline is well-structured and directly related to
    the topic.
    Return the output in the following JSON format:
    {
     "outlines":[
     "Point 1",
     "Point 2",
     "Point 3",
     "Point 4",
     "Point 5",
     "Point 6",
     ]
    }
     Ensure that the JSON is valid and properly formatted. Do not
     include any other text or explanations outside the JSON
    `;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful AI that generates outlines for presentations.",
        },
        {
          role: "user",
          content: finalPrompt,
        },
      ],
      temperature: 1,
      max_tokens: 4096,
    });
    // console.log("completion", completion);

    const responseContent = completion.choices[0].message?.content;

    if (responseContent) {
      const cleanResponse = responseContent
        .trim()
        .replace(/^```json|```$/g, "");
      const jsonResponse = JSON.parse(cleanResponse);
      console.log("responseContent", jsonResponse);
    }
    if (responseContent) {
      try {
        const cleanResponse = responseContent
          .trim()
          .replace(/^```json|```$/g, "");
        const jsonResponse = JSON.parse(cleanResponse);
        return { status: 200, data: jsonResponse };
      } catch (error) {
        console.error("Invalid JSON received:", responseContent, error);
        return { status: 500, error: "Invalid JSON format received from AI" };
      }
    }
    console.log("responseContent", responseContent);
    return { status: 400, error: "No content generated" };
  } catch (error) {
    console.error("Error", error);
    return { status: 500, error: "Internal server error" };
  }
};

const generateImageUrl = async (prompt: string): Promise<string> => {
  try {
    const improvedPrompt = `
    Create a highly realistic professional image based on the following description. The image should look as if captured in real life, with attention to detail , lighting and texture.
    Description:${prompt}

    Important Notes:
    -The image must be in a photorealistic style and visually compelling.
    -Ensure all text, signs or visible writing in the image are in English.
    -Pay special attention to lighting, shadows and textures to make the image as lifelike as possible.
    -Avoid elements that appear abstract, cartoonish , or overly artistic. The image should be suitable fro professional presentations.
    -Focus on accurately depicting the concept described, including specific objects,environment,mood,and context.Maintain
    relevance to the description provided.

    Example Use Cases:Business presentations,educational slides,professional designs.
    `;

    const dalleResponse = await openai.images.generate({
      prompt: improvedPrompt,
      n: 1,
      size: "1024x1024",
    });
    console.log("Image generated successfully:", dalleResponse.data[0]?.url);

    return dalleResponse.data[0]?.url || "https://via.placeholder.com/1024";
  } catch (error) {
    console.error("Failed to generate image:", error);
    return "https://via.placeholder.com/1024";
  }
};

const findImageComponents = (layout: ContentItem): ContentItem[] => {
  const images = [];
  console.log("Layout", layout);
  if (layout.type === "image") {
    images.push(layout);
  }
  if (Array.isArray(layout.content)) {
    layout.content.forEach((child) => {
      images.push(...findImageComponents(child as ContentItem));
    });
  } else if (layout.content && typeof layout.content === "object") {
    images.push(...findImageComponents(layout.content));
  }
  return images;
};

const replaceImagePlaceholders = async (layout: Slide) => {
  console.log("layout", layout);
  const imageComponents = findImageComponents(layout.content);
  console.log("Found image components:", imageComponents);
  for (const component of imageComponents) {
    console.log("Generating image for component:", component.alt);
    component.content = await generateImageUrl(
      component.alt || "placeholder Image"
    );
  }
};

export const generateLayoutsJson = async (outlineArray: string[]) => {
  const prompt = `
  You are a highly creative AI that generates JSON-based layouts for presentations. I will provide you with an array of outlines,and for each outline,you must generate a unique and creative layout. Use the existing layouts as example for structure and design , and generate unique design based on the provided outline.
  
  ###Guidelines:
  1. Write layouts based on the specific outline provided.
  2. Use diverse and engaging designs, ensuring each layout is unique.
  3. Adhere to the structure of existing layouts but add new styles or components if needed.
  4. Fill placeholder data into content fields where required.
  5. Generate unique image placeholder for the 'content' property of image components and also alt text according to the outline.
  6. Ensure proper formatting and schema alignment for the output JSON.

  ###Example Layouts:

  ###Outline Array:
  ${JSON.stringify(outlineArray)}

  For each entry in the outline array, generate: 
  - A unique JSON layout with creative designs. 
  - Properly filled content, including placeholders for image components. 
  - Clear and well-structured JSON data. 
    For Images 
  - The alt text should describe the image clearly and concisely. 
  - Focus on the main subject(s) of the image and any relevant details such as colors, shapes, people, or objects. 
  - Ensure the alt text aligns with the context of the presentation slide it will be used on (e.g., professional, educational, business-related). 
  - Avoid using terms like "image of" or "picture of," and instead focus directly on the content and meaning. 
   Output the layouts in JSON format. Ensure there are no duplicate layouts across the array.
  `;

  try {
    console.log("Generating layouts...");
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You generate JSON layouts for presentations.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 5000,
      temperature: 0.7,
    });

    const responseContent = completion?.choices?.[0]?.message?.content;

    console.log("responseContent", responseContent);
    if (!responseContent) {
      return { status: 400, error: "No content generated" };
    }
    let jsonResponse;
    console.log(
      "jsonResponse,responseContent",
      JSON.parse(responseContent.trim().replace(/```json|```/g, ""))
    );
    try {
      jsonResponse = JSON.parse(
        responseContent.trim().replace(/```json|```/g, "")
      );
      await Promise.all(jsonResponse.map(replaceImagePlaceholders));
    } catch (error) {
      console.log("Error:", error);
      throw new Error("Invalid JSON format received from AI");
    }
    console.log("Layouts generated successfully");
    return { status: 200, data: jsonResponse };
  } catch (error) {
    console.error("Error", error);
    return { status: 500, error: "Internal server error" };
  }
};

export const generateLayouts = async (projectId: string, theme: string) => {
  try {
    if (!projectId) {
      return { status: 400, error: "Project ID is required" };
    }
    const user = await currentUser();
    if (!user) {
      return { status: 403, error: "User not authenticated" };
    }

    const userExist = await client.user.findUnique({
      where: { clerkId: user.id },
    });

    if (!userExist || !userExist.subscription) {
      return {
        status: 403,
        error: !userExist?.subscription
          ? "User does not have an active subscription"
          : "User not found in the database",
      };
    }

    const project = await client.project.findUnique({
      where: {
        id: projectId,
        isDeleted: false,
      },
    });
    if (!project) {
      return { status: 404, error: "Project not found" };
    }

    if (!project.outlines || project.outlines.length === 0) {
      return { status: 400, error: "Project does not have any outlines" };
    }

    const layouts = await generateLayoutsJson(project.outlines);
    if (layouts.status !== 200) {
      return layouts;
    }
    await client.project.update({
      where: {
        id: projectId,
      },
      data: { slides: layouts.data, themeName: theme },
    });

    return { status: 200, data: layouts.data };
  } catch (error) {
    console.error("Error", error);
    return { status: 500, error: "Internal server error", data: [] };
  }
};
