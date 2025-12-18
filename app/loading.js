import Image from 'next/image';

export default function Loading() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[#fcfcfc]">
            <div className="animate-pulse">
                <Image
                    src="/logo.png"
                    alt="Loading..."
                    width={180}
                    height={45}
                    className="object-contain opacity-50"
                    priority
                />
            </div>
        </div>
    );
}
