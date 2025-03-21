/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { getProjectById } from "@/actions/project";
import { themes } from "@/lib/constants";
import { useSlideStore } from "@/store/useSlideStore";
import { Loader2 } from "lucide-react";
import { useTheme } from "next-themes";
import { redirect, useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { toast } from "sonner";

type Props = {};

const Page = (props: Props) => {
  const params = useParams();
  const { setTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const { setSlides, setProject, currentTheme, setCurrentTheme } =
    useSlideStore();

  useEffect(() => {
    if (!params.presentationId) return; // Avoid fetching if undefined

    (async () => {
      try {
        const res = await getProjectById(params.presentationId as string);
        if (res.status !== 200 || !res.data) {
          toast.error("Error", {
            description: "Unable to fetch project",
          });
          return redirect("/dashboard");
        }
        const findTheme = themes.find(
          (theme) => theme.name === res.data.themeName
        );
        setCurrentTheme(findTheme || themes[0]);
        setTheme(findTheme?.type === "dark" ? "dark" : "light");
        setProject(res.data);
        setSlides(JSON.parse(JSON.stringify(res.data.slides)));
      } catch (error) {
        toast.error("Error", {
          description: "An unexpected error occurred",
        });
      } finally {
        setIsLoading(false);
      }
    })();
  }, [params.presentationId]); // Depend on params.presentationId

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  return (
    <DndProvider backend={HTML5Backend}>
      <div></div>
    </DndProvider>
  );
};

export default Page;
