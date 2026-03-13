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
        <div className="w-85 h-full border-r bg-muted/20 p-6 flex flex-col gap-8">
            <div className="flex items-center gap-3 px-2">
                <div className="bg-primary p-2 rounded-xl shadow-lg shadow-primary/20">
                    <ImageIcon className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                    <h2 className="text-xl font-bold tracking-tight">Image Seeker</h2>
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Visual Assistant</p>
                </div>
            </div>

            <div className="flex flex-col gap-5 bg-card/50 backdrop-blur-sm p-5 rounded-2xl border shadow-sm transition-all hover:shadow-md">
                <div className="space-y-1">
                    <h3 className="font-semibold text-sm">기억 주입 (취향 학습)</h3>
                    <p className="text-xs text-muted-foreground">이미지를 업로드하여 취향을 학습시킵니다.</p>
                </div>

                <div className="space-y-3">
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">카테고리</label>
                        <Select value={category} onValueChange={(val) => setCategory(val || "")}>
                            <SelectTrigger className="w-full h-10 bg-background/50 border-muted-foreground/20 hover:border-primary/50 transition-colors">
                                <SelectValue placeholder="카테고리 선택" />
                            </SelectTrigger>
                            <SelectContent className="bg-popover/95 backdrop-blur-xl border-muted-foreground/20 shadow-2xl">
                                <SelectItem value="architecture">건축 (Architecture)</SelectItem>
                                <SelectItem value="nature">자연/풍경 (Nature)</SelectItem>
                                <SelectItem value="portrait">인물 (Portrait)</SelectItem>
                                <SelectItem value="interior">인테리어 (Interior)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">이미지 파일</label>
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                        />
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="group relative border-2 border-dashed border-muted-foreground/20 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer bg-muted/30 hover:bg-muted/50 hover:border-primary/50 transition-all active:scale-[0.98]"
                        >
                            {file ? (
                                <div className="flex flex-col items-center gap-2">
                                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                        <ImageIcon className="w-5 h-5 text-primary" />
                                    </div>
                                    <span className="text-xs font-medium text-center break-all max-w-[180px]">{file.name}</span>
                                </div>
                            ) : (
                                <>
                                    <div className="w-12 h-12 bg-background rounded-full flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow mb-3">
                                        <Upload className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                                    </div>
                                    <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground">클릭하여 이미지 추가</span>
                                    <p className="text-[10px] text-muted-foreground/60 mt-1">JPG, PNG up to 10MB</p>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <Button
                    onClick={handleUpload}
                    className="w-full h-10 mt-2 shadow-lg shadow-primary/20 active:scale-[0.98] transition-transform"
                    disabled={!file || !category}
                >
                    학습 시작하기
                </Button>
            </div>

            <div className="mt-auto p-4 bg-muted/30 rounded-xl border border-dashed border-muted-foreground/20">
                <p className="text-[10px] text-muted-foreground leading-relaxed text-center">
                    취향 데이터를 기반으로 AI가 <br />
                    최적의 시각적 영감을 찾아드립니다.
                </p>
            </div>
        </div>
    );
}
