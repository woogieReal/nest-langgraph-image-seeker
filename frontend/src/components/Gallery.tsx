import { ScrollArea } from "./ui/scroll-area";
import { Card, CardContent } from "./ui/card";
import type { ImageResult } from "../types";

interface GalleryProps {
    images: ImageResult[];
}

export function Gallery({ images }: GalleryProps) {
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
                    <Card key={img.id} className="overflow-hidden group hover:shadow-md transition-all">
                        <CardContent className="p-0 relative aspect-square">
                            <img
                                src={img.url}
                                alt={img.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://placehold.co/400?text=Image+Not+Found';
                                }}
                            />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4 text-white">
                                <p className="font-medium text-sm truncate">{img.title}</p>
                                <div className="mt-1 inline-flex w-fit items-center rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-xs font-semibold">
                                    {img.category}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </ScrollArea>
    );
}
