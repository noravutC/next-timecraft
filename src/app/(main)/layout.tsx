import { MergBar } from "@/src/app/globals/mergbar";

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <MergBar>
            {children}
        </MergBar>
    )
}