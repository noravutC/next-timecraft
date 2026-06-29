import { ArrowLeft, ArrowRight, Sparkles, Upload, X } from "lucide-react";
import { Loader } from "@/components/ui/loader";
import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useProjectStore } from "@/store";
import { PROJECT_TEMPLATES } from "@/helper/default-project";
import { useColumnStore } from "@/store/use-column.store";

const MAX_PROJECT_COVER_FILE_SIZE = 2 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
];

const fileToDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });

export const CreateFirstProject = () => {
  const { createProject, status, projects, setNeedCreateProject } =
    useProjectStore();
  const { createColumns } = useColumnStore();
  const [projectName, setProjectName] = useState("");
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null,
  );
  const [direction, setDirection] = useState<1 | -1>(1);
  const projectLength = Object.keys(projects).length;
  const slideVariants = {
    enter: (dir: 1 | -1) => ({
      opacity: 0,
      x: dir > 0 ? 80 : -80,
    }),
    center: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.25 },
    },
    exit: (dir: 1 | -1) => ({
      opacity: 0,
      x: dir > 0 ? -80 : 80,
      transition: { duration: 0.25 },
    }),
  };
  const selectedTemplate = useMemo(
    () =>
      PROJECT_TEMPLATES.find(
        (template) => template.id === selectedTemplateId,
      ) ?? null,
    [selectedTemplateId],
  );

  const onCoverFileChange = async (file: File | null) => {
    if (!file) {
      setCoverImage(null);
      return;
    }

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      toast.error("Please upload JPG, PNG, WEBP, GIF, or AVIF.");
      return;
    }

    if (file.size > MAX_PROJECT_COVER_FILE_SIZE) {
      toast.error("Project image must be 2MB or less.");
      return;
    }

    try {
      const dataUrl = await fileToDataUrl(file);
      setCoverImage(dataUrl);
    } catch (error) {
      console.error("Unable to read project image:", error);
      toast.error("Unable to read selected image.");
    }
  };

  const onCreateProject = async () => {
    if (!selectedTemplate) {
      toast.error("Please choose a template.");
      return;
    }

    const name = projectName.trim();
    if (!name) {
      toast.error("Please enter project name.");
      return;
    }

    try {
      const createdProject = await createProject({
        name,
        coverImage,
        // templateColumns: selectedTemplate.columns,
      });

      if (!createdProject) {
        toast.error("Unable to create project.");
        return;
      }
      const payloadColumns = selectedTemplate.columns.map((col) => ({
        ...col,
        projectId: createdProject.id,
        orderFraction: "",
      }));

      await createColumns(payloadColumns);

      toast.success("Project created successfully.");
    } catch (error) {
      console.error("Create project failed:", error);
      toast.error("Unable to create project.");
    }
  };

  return (
    <div className="w-full flex items-center justify-center pt-10 overflow-hidden">
      <div className="flex flex-col justify-center items-center max-w-[1200px] w-full px-4">
        <div className="mb-10 flex flex-col items-center text-center">
          <div className="w-fit flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-semibold mb-6">
            <Sparkles size={16} />
            <span>Welcome to your new Workspace</span>
          </div>

          <h1 className="text-4xl font-extrabold text-gray-900 mb-6 leading-tight">
            Organize your work efficiently <br />
            <span className="text-blue-600">
              Start from scratch or use a template
            </span>
          </h1>

          <p className="text-sm text-gray-500 mb-8 max-w-lg mx-auto">
            You don't have any projects yet. No worries! Get started easily by
            creating a blank board or choosing a pre-made template below.
          </p>
        </div>

        <div className="w-full min-h-[400px]">
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="h-px w-1/2 bg-gray-200"></div>
            <span className="text-xs min-w-max text-gray-400 font-semibold uppercase tracking-wider">
              {!selectedTemplate
                ? "Choose a popular template"
                : "Setup Project Details"}
            </span>
            <div className="h-px w-1/2 bg-gray-200"></div>
          </div>

          <AnimatePresence mode="wait" custom={direction}>
            {selectedTemplate ? (
              <motion.div
                key="project-details"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="w-full w-full flex flex-col items-center"
              >
                <div className="max-w-100 w-full flex h-fit items-end gap-4">
                  <LabelInput title={"Project"}>
                    <div className="flex items-center gap-2">
                      <Input
                        autoFocus
                        className="w-full h-10"
                        placeholder="Enter project name"
                        onChange={(e) => setProjectName(e.target.value)}
                      />
                    </div>
                    <div className="mt-4">
                      <Label className="text-gray-600/90 font-semibold mb-2 block">
                        Project image
                      </Label>
                      {coverImage ? (
                        <div className="relative h-32 w-full overflow-hidden rounded-xl border border-gray-200">
                          <img
                            src={coverImage}
                            alt="Project cover preview"
                            className="h-full w-full object-cover"
                          />
                          <Button
                            type="button"
                            variant="secondary"
                            size="icon"
                            className="absolute right-2 top-2 size-7"
                            onClick={() => setCoverImage(null)}
                          >
                            <X className="size-4" />
                          </Button>
                        </div>
                      ) : (
                        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-5 text-sm font-medium text-gray-600 hover:border-blue-400 hover:text-blue-600">
                          <Upload className="size-4" />
                          Upload project image (max 2MB)
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(event) =>
                              onCoverFileChange(event.target.files?.[0] ?? null)
                            }
                          />
                        </label>
                      )}
                    </div>

                    <div className="mt-6 flex gap-3">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setDirection(-1);
                          setSelectedTemplateId(null);
                        }}
                      >
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back
                      </Button>
                      <Button
                        className="flex-1"
                        disabled={
                          status === "creating" ||
                          projectName.trim().length === 0
                        }
                        onClick={onCreateProject}
                      >
                        {status === "creating" ? (
                          <Loader size="xs" onColor />
                        ) : (
                          <>
                            Create Project
                            {/* <ArrowRight className="size-4" /> */}
                          </>
                        )}
                      </Button>
                    </div>
                  </LabelInput>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="template-grid"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="w-full grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 text-left"
              >
                {projectLength > 0 && (
                  <button
                    // key={template.id}
                    onClick={() => setNeedCreateProject(false)}
                    className={`group cursor-pointer relative p-6 rounded-2xl border border-gray-100 bg-white hover:border-blue-500/60 hover:shadow-lg transition-all duration-300 flex flex-col h-full`}
                  >
                    <div
                      className={`w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                    >
                      <ArrowLeft className="text-gray-500" />
                    </div>
                    <div className="flex flex-col items-start w-full mb-4">
                      <p className="text-md font-semibold text-gray-900">
                        {"Back to Projects"}
                      </p>
                      <p className="text-xs text-gray-500">
                        Return to your existing projects
                      </p>
                    </div>
                  </button>
                )}
                {PROJECT_TEMPLATES.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => {
                      setDirection(1);
                      setSelectedTemplateId(template.id);
                    }}
                    className={`group cursor-pointer relative p-6 rounded-2xl border border-gray-100 bg-white hover:border-blue-500/60 hover:shadow-lg transition-all duration-300 flex flex-col h-full`}
                  >
                    <div
                      className={`w-12 h-12 rounded-xl ${template.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                    >
                      {template.icon}
                    </div>
                    <div className="flex flex-col items-start w-full mb-4">
                      <p className="text-md font-semibold text-gray-900">
                        {template.name}
                      </p>
                      <p className="text-start text-xs text-gray-500">
                        {template.description}
                      </p>
                    </div>
                    <div className="flex items-center text-blue-600 font-medium text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                      Use Template <ArrowRight size={16} className="ml-1" />
                    </div>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

interface LabelInputProps {
  title: string;
  children: React.ReactNode;
}
export const LabelInput = ({ title, children }: LabelInputProps) => {
  return (
    <div className="w-full flex flex-col gap-2">
      <Label className="text-gray-600/90 font-semibold">{title}</Label>
      <div>{children}</div>
    </div>
  );
};
