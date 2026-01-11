// project/components/create-first-project.tsx

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from "framer-motion";
import { useTemplateColumnsStore } from '@/hooks/useTemplateColumn.hook';
import { ArrowRight, Layout, ListTodo, Plus, Sparkles, Columns, FileQuestion, ArrowLeft, LoaderCircle } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useShallow } from 'zustand/react/shallow';

const icons = [
    <Columns key="icon-1" />,
    <ListTodo key="icon-2" />,
    <Layout key="icon-2" />
];
const colors = [
    'bg-blue-100 text-blue-600',
    'bg-emerald-100 text-emerald-600'
]

export const CreateFirstProject = () => {
    const {
        fetchTemplateColumns,
        templateColumns,
        applyBoardTemplateIntoProject, // สมมติว่าฟังก์ชันนี้ใช้เปลี่ยน status หรือ save
        status,
    } = useTemplateColumnsStore(useShallow((state) => ({
        fetchTemplateColumns: state.fetchTemplateColumns,
        templateColumns: state.templateColumns,
        applyBoardTemplateIntoProject: state.applyBoardTemplateIntoProject,
        status: state.status,
    })));
    const [projectName, setProjectName] = useState<string>('');
    const [choosedTem, setChoosedTem] = useState<string>('');

    useEffect(() => {
        fetchTemplateColumns();
    }, [fetchTemplateColumns])

    const columnTemplates = Object.values(templateColumns).map((t, i) => ({
        ...t,
        icon: icons[i] || <FileQuestion size={24} />,
        color: colors[i],
    }));

    // Animation Variants เพื่อความสะอาดของโค้ด
    const slideLeftExit = {
        initial: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -100, transition: { duration: 0.3 } } // หายไปทางซ้าย
    };

    const handleApplyTemplateAndNewProject = async () => {
        const templateValues = templateColumns[choosedTem];
        if (!templateValues || !projectName || projectName === '') {
            toast.error('Please enter project name!!!');
            return;
        }
        await applyBoardTemplateIntoProject({
            projectName: projectName,
            template: templateValues,
        });
        // toast.success('Apply success.');
    }
    // console.log('status: ', status);

    return (
        <div className='w-full flex items-center justify-center pt-10 overflow-hidden'>

            <div className='flex flex-col justify-center items-center max-w-[1000px] w-full px-4'>
                <div className="mb-10 flex flex-col items-center text-center">
                    <div className="w-fit flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-semibold mb-6">
                        <Sparkles size={16} />
                        <span>Welcome to your new Workspace</span>
                    </div>

                    <h1 className="text-4xl font-extrabold text-gray-900 mb-6 leading-tight">
                        Organize your work efficiently <br />
                        <span className="text-blue-600">Start from scratch or use a template</span>
                    </h1>

                    <p className="text-sm text-gray-500 mb-8 max-w-lg mx-auto">
                        You don't have any projects yet. No worries! Get started easily by creating a blank board or choosing a pre-made template below.
                    </p>
                </div>

                <div className='w-full min-h-[400px]'> {/* กำหนด min-h เพื่อไม่ให้ layout กระตุกเวลาเปลี่ยน view */}

                    {/* Header เล็กๆ เปลี่ยนตาม Status */}
                    <div className="flex items-center justify-center gap-4 mb-8">
                        <div className="h-px w-26 bg-gray-200"></div>
                        <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
                            {!templateColumns[choosedTem] ? 'Choose a popular template' : 'Setup Project Details'}
                        </span>
                        <div className="h-px w-26 bg-gray-200"></div>
                    </div>

                    <AnimatePresence mode="wait">
                        {templateColumns[choosedTem] ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className='w-full w-full flex flex-col items-center'
                            >
                                <div className='max-w-100 w-full flex h-fit items-end gap-4'>
                                    <LabelInput title={'Project'}>
                                        <div className='flex items-center gap-2'>
                                            <Input
                                                autoFocus
                                                className='w-full h-10'
                                                placeholder='Enter project name'
                                                onChange={(e) => setProjectName(e.target.value)}
                                            />
                                            <Button
                                                className='h-10'
                                                type='button'
                                                disabled={status === 'updating'}
                                                onClick={handleApplyTemplateAndNewProject}
                                            >
                                                {status === 'updating' && (
                                                    <LoaderCircle className="animate-spin size-4 text-blue-500" />
                                                )}
                                                {status === 'none' && (
                                                    <ArrowRight />
                                                )}
                                            </Button>
                                        </div>
                                    </LabelInput>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="template-grid"
                                variants={slideLeftExit}
                                initial="initial"
                                animate="initial"
                                exit="exit"
                                className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-left"
                            >
                                {columnTemplates.map((template) => (
                                    <button
                                        key={template._id}
                                        onClick={() => setChoosedTem(template._id)}
                                        className={`group cursor-pointer relative p-6 rounded-2xl border border-gray-100 bg-white hover:border-blue-500/60 hover:shadow-lg transition-all duration-300 flex flex-col h-full`}
                                    >
                                        <div className={`w-12 h-12 rounded-xl ${template.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                            {template.icon}
                                        </div>
                                        <div className='flex flex-col items-start w-full mb-4'>
                                            <p className='text-md font-semibold text-gray-900'>{template.name}</p>
                                            <p className='text-xs text-gray-500'>{template.description}</p>
                                        </div>
                                        <div className="flex items-center text-blue-600 font-medium text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                            Use Template <ArrowRight size={16} className="ml-1" />
                                        </div>
                                    </button>
                                ))}

                                {[1, 2].map((item) => (
                                    <div key={item} className={`group cursor-pointer relative p-6 rounded-2xl border border-gray-100 bg-white hover:border-gray-500/60 hover:shadow-lg transition-all duration-300 flex flex-col h-full opacity-60`}>
                                        <div className='flex flex-col items-center justify-center w-full h-full'>
                                            <p className='text-lg font-semibold text-gray-600'>Incoming...</p>
                                        </div>
                                    </div>
                                ))}
                            </motion.div>

                        )}
                    </AnimatePresence>

                </div>
            </div>
        </div>
    )
}

interface LabelInputProps {
    title: string;
    children: React.ReactNode;
}
export const LabelInput = ({
    title,
    children,
}: LabelInputProps) => {
    return (
        <div className='w-full flex flex-col gap-2'>
            <Label className='text-gray-600/90 font-semibold'>{title}</Label>
            <div>{children}</div>
        </div>
    )
}
