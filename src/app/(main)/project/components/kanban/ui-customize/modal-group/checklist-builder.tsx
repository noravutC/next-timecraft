import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label"
import { useState } from "react";

import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface TaskCheckListProps {
    title: string;
    checked: boolean;
}

interface CheckListBuilderProps {
    // checkListTitle: string;
}

export const CheckListBuilder = ({
    // checkListTitle,
}: CheckListBuilderProps) => {
    const [taskCheckList, setTaskCheckList] = useState<TaskCheckListProps[]>([]);
    const [titleCheckList, setTitleCheckList] = useState<string | null>(null);
    const [openFormCheckList, setOpenFormCheckList] = useState<boolean>(false);
    const handleNewCheckList = () => {
        if (titleCheckList) {
            setTaskCheckList((prev) => [...prev, { title: titleCheckList, checked: false }]);
        } else {
            toast.error('Please input title before create.');
        }
    }
    return (
        <div className="w-full flex flex-col my-4 px-4">
            {taskCheckList.map((cList, index) => (
                <div key={index} className="flex items-center gap-3">
                    <Checkbox
                        id={`${index}`}
                        checked={cList.checked}
                        onCheckedChange={(checked) => console.log('Checked: ', checked)}
                    />
                    <Label htmlFor="terms">{cList.title}</Label>
                </div>
            ))}
            <div className="flex flex-col gap-4 items-end w-full">
                {openFormCheckList && (
                    <>
                    <div className="flex items-center gap-3 w-full">
                        <Checkbox
                            disabled={true}
                            // id={`${index}`}
                            checked={false}
                        // onCheckedChange={(checked) => console.log('Checked: ', checked)}
                        />
                        <Input autoFocus onChange={(e) => setTitleCheckList(e.target.value)} />
                    </div>
                    <Button onClick={handleNewCheckList}>Create</Button>
                    </>
                )}
                {/* <div className=""></div> */}
                {/* <Button
                    className="w-fit"
                    // disabled={openFormCheckList}
                    onClick={() => setOpenFormCheckList(true)}
                    // onBlur={() => setOpenFormCheckList(false)}
                >
                    Add check list
                </Button> */}

            </div>
        </div>
    )
}