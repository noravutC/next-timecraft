interface LogoProps {
    size?: number;
    textSize?: 'xs' | 'sm' | 'base' | 'lg' | 'xl';
}
export const Logo = ({ size = 25, textSize = 'base' }: LogoProps) => {
    return (
        <div className="flex items-center gap-2">
            <div className="w-fit h-fit shadow-md">
                <svg width={size} height={size} viewBox="0 0 561 555" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M521.503 555H371.512L0.0364825 184.836V45.462C-1.16344 9.49464 27.5347 0.835825 42.0337 1.00234H188.524L561 375.163V520.531C557.4 544.909 533.169 553.668 521.503 555Z" fill="#3B82F6" />
                    <path d="M0.0362596 515V300L253.036 555H29.0363C4.63626 551.4 -0.46374 526.833 0.0362596 515Z" fill="#FFA239" />
                    <path d="M560.036 36V258L297.536 0.5L516.536 0C547.736 3.6 559.87 25.8333 560.036 36Z" fill="#F472B6" />
                </svg>
            </div>
            <p className={`font-semibold ${textSize === 'xs' ? 'text-xs' : textSize === 'sm' ? 'text-sm' : textSize === 'base' ? 'text-base' : textSize === 'lg' ? 'text-lg' : 'text-xl'}`}>timecraft</p>
        </div>
    )
}