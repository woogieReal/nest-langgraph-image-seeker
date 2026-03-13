import { useState } from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Maximize2, Download, X } from "lucide-react";
import type { ImageResult } from "../types";

interface GalleryProps {
    images: ImageResult[];
}

export function Gallery({ images }: GalleryProps) {
    const [selectedImage, setSelectedImage] = useState<ImageResult | null>(null);

    const handleDownload = async (url: string, title: string) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = `${title.replace(/\s+/g, '_')}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error('Download failed:', error);
            window.open(url, '_blank');
        }
    };

    if (images.length === 0) return null;

    return (
        <div className="w-full">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {images.map((img) => (
                    <Card key={img.id} className="overflow-hidden group hover:shadow-md transition-all relative border-none bg-muted/20">
                        <CardContent className="p-0 relative aspect-[4/3]">
                            <img
                                src={img.url}
                                alt={img.title}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://placehold.co/400?text=Image+Not+Found';
                                }}
                            />

                            {/* Hover Overlay */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                                <div className="flex justify-end gap-1.5 translate-y-[-10px] group-hover:translate-y-0 transition-transform duration-300">
                                    <Button
                                        size="icon"
                                        variant="secondary"
                                        className="h-7 w-7 bg-white/20 backdrop-blur-md border border-white/30 text-white hover:bg-white/40"
                                        onClick={() => setSelectedImage(img)}
                                    >
                                        <Maximize2 className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                        size="icon"
                                        variant="secondary"
                                        className="h-7 w-7 bg-white/20 backdrop-blur-md border border-white/30 text-white hover:bg-white/40"
                                        onClick={() => handleDownload(img.url, img.title)}
                                    >
                                        <Download className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                                <div className="text-white">
                                    <p className="font-medium text-[10px] truncate drop-shadow-md">{img.title}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Lightbox Modal (using Portal-like behavior if possible, or just fixed) */}
            {selectedImage && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 sm:p-8 animate-in fade-in duration-300"
                    onClick={() => setSelectedImage(null)}
                >
                    <Button
                        size="icon"
                        variant="ghost"
                        className="absolute top-4 right-4 text-white hover:bg-white/10 z-[60]"
                        onClick={() => setSelectedImage(null)}
                    >
                        <X className="h-8 w-8" />
                    </Button>

                    <div
                        className="relative max-w-6xl max-h-full w-full flex flex-col items-center justify-center gap-6 animate-in zoom-in-95 duration-300"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="relative group">
                            <img
                                src={selectedImage.url}
                                alt={selectedImage.title}
                                className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10"
                            />
                        </div>
                        <div className="text-white text-center max-w-2xl px-4">
                            <h3 className="text-2xl font-bold tracking-tight mb-4">{selectedImage.title}</h3>
                            <div className="flex gap-4 justify-center">
                                <Button
                                    size="lg"
                                    onClick={() => handleDownload(selectedImage.url, selectedImage.title)}
                                    className="bg-white text-black hover:bg-zinc-200 h-12 px-8 font-semibold rounded-full shadow-lg transition-all active:scale-95"
                                >
                                    <Download className="mr-2 h-5 w-5" />
                                    고화질 다운로드
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
