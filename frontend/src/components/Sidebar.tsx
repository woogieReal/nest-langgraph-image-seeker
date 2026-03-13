import { useState, useRef } from "react";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Upload, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

export function Sidebar() {
    const [category, setCategory] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUpload = async () => {
        if (!category) {
            toast.error("카테고리를 선택해주세요.");
            return;
        }
        if (!file) {
            toast.error("이미지를 선택해주세요.");
            return;
        }

        const formData = new FormData();
        formData.append("category", category);
        formData.append("file", file);

        toast.info(`${file.name} 파일(카테고리: ${category})을 분석 중입니다...`);

        try {
            const response = await fetch("http://localhost:3000/preferences/upload", {
                method: "POST",
                body: formData,
            });
            if (!response.ok) throw new Error("업로드 실패");

            toast.success("기억이 성공적으로 주입되었습니다!");
            setFile(null);
            setCategory("");
        } catch (error) {
            console.error(error);
            toast.error("분석 중 오류가 발생했습니다. (API 키 및 네트워크를 확인하세요)");
        }
    };

    return (
        <div className="w-80 h-full border-r bg-muted/30 p-4 flex flex-col gap-6">
            <div className="flex items-center gap-2 px-2">
                <ImageIcon className="w-6 h-6 text-primary" />
                <h2 className="text-xl font-bold">Image Seeker</h2>
            </div>

            <div className="flex flex-col gap-4 mt-4 bg-background p-4 rounded-xl border shadow-sm">
                <h3 className="font-semibold px-1">기억 주입 (취향 학습)</h3>

                <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium px-1">카테고리</label>
                    <Select value={category} onValueChange={(val) => setCategory(val || "")}>
                        <SelectTrigger>
                            <SelectValue placeholder="카테고리 선택" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="architecture">건축 (Architecture)</SelectItem>
                            <SelectItem value="nature">자연/풍경 (Nature)</SelectItem>
                            <SelectItem value="portrait">인물 (Portrait)</SelectItem>
                            <SelectItem value="interior">인테리어 (Interior)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium px-1">이미지 업로드</label>
                    <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                    />
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                        {file ? (
                            <span className="text-sm text-center break-all">{file.name}</span>
                        ) : (
                            <>
                                <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                                <span className="text-sm text-muted-foreground">클릭하여 이미지 추가</span>
                            </>
                        )}
                    </div>
                </div>

                <Button onClick={handleUpload} className="w-full mt-2" disabled={!file || !category}>
                    학습하기
                </Button>
            </div>
        </div>
    );
}
