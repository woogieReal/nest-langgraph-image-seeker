import { useState } from "react";
import { ScrollArea } from "./ui/scroll-area";
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
            // Fallback: open in new tab
            window.open(url, '_blank');
        }
    };

    if (images.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center bg-muted/5 text-muted-foreground p-8 text-center border-t">
                <p>검색된 이미지가 여기에 표시됩니다.</p>
            </div>
        );
    }

    return (
        <ScrollArea className="flex-1 bg-muted/5">
            <div className="p-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {images.map((img) => (
                    <Card key={img.id} className="overflow-hidden group hover:shadow-md transition-all relative">
                        <CardContent className="p-0 relative aspect-square">
                            <img
                                src={img.url}
                                alt={img.title}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://placehold.co/400?text=Image+Not+Found';
                                }}
                            />

                            {/* Hover Overlay */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                                <div className="flex justify-end gap-2 translate-y-[-10px] group-hover:translate-y-0 transition-transform duration-300">
                                    <Button
                                        size="icon"
                                        variant="secondary"
                                        className="h-8 w-8 bg-white/20 backdrop-blur-md border-white/30 text-white hover:bg-white/40"
                                        onClick={() => setSelectedImage(img)}
                                    >
                                        <Maximize2 className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        size="icon"
                                        variant="secondary"
                                        className="h-8 w-8 bg-white/20 backdrop-blur-md border-white/30 text-white hover:bg-white/40"
                                        onClick={() => handleDownload(img.url, img.title)}
                                    >
                                        <Download className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div className="text-white">
                                    <p className="font-medium text-xs truncate drop-shadow-md">{img.title}</p>
                                    <div className="mt-1 inline-flex items-center rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-[10px] font-semibold backdrop-blur-sm">
                                        {img.category}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Lightbox Modal */}
            {selectedImage && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-300"
                    onClick={() => setSelectedImage(null)}
                >
                    <Button
                        size="icon"
                        variant="ghost"
                        className="absolute top-4 right-4 text-white hover:bg-white/10 z-[60]"
                        onClick={() => setSelectedImage(null)}
                    >
                        <X className="h-6 w-6" />
                    </Button>

                    <div
                        className="relative max-w-5xl max-h-[90vh] w-full flex flex-col items-center justify-center gap-4 animate-in zoom-in-95 duration-300"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img
                            src={selectedImage.url}
                            alt={selectedImage.title}
                            className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
                        />
                        <div className="text-white text-center">
                            <h3 className="text-xl font-semibold">{selectedImage.title}</h3>
                            <div className="mt-2 flex gap-3 justify-center">
                                <Button
                                    onClick={() => handleDownload(selectedImage.url, selectedImage.title)}
                                    className="bg-white text-black hover:bg-white/90"
                                >
                                    <Download className="mr-2 h-4 w-4" />
                                    Download High Res
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </ScrollArea>
    );
}
