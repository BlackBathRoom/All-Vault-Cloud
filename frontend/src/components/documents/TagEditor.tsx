import { useState } from 'react'
import { X, Sparkles, Loader2 } from 'lucide-react'
import { PREDEFINED_TAGS, TAG_LABELS, type PredefinedTag } from '../../types/document'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { classifyDocument } from '../../api/tagsApi'

interface TagEditorProps {
    documentId: string
    tags: string[]
    onTagsChange: (tags: string[]) => void
    onCategoryChange?: (category: string) => void
}

export function TagEditor({ documentId, tags, onTagsChange, onCategoryChange }: TagEditorProps) {
    const [customTag, setCustomTag] = useState('')
    const [isClassifying, setIsClassifying] = useState(false)
    const [classificationMessage, setClassificationMessage] = useState('')

    const addTag = (tag: string) => {
        if (!tags.includes(tag)) {
            onTagsChange([...tags, tag])
        }
    }

    const removeTag = (tag: string) => {
        onTagsChange(tags.filter(t => t !== tag))
    }

    const addCustomTag = () => {
        if (customTag.trim() && !tags.includes(customTag.trim())) {
            onTagsChange([...tags, customTag.trim()])
            setCustomTag('')
        }
    }

    const handleAIClassify = async () => {
        setIsClassifying(true)
        setClassificationMessage('')
        try {
            const result = await classifyDocument(documentId)
            
            // 既存タグと結合（重複削除）
            const newTags = [...new Set([...tags, ...result.classification.tags])]
            onTagsChange(newTags)
            
            // カテゴリも更新
            if (onCategoryChange && result.classification.category) {
                onCategoryChange(result.classification.category)
            }
            
            setClassificationMessage(
                `✓ ${result.classification.message} (信頼度: ${(result.classification.confidence * 100).toFixed(0)}%)`
            )
        } catch (error) {
            setClassificationMessage(
                `✗ エラー: ${error instanceof Error ? error.message : '分類に失敗しました'}`
            )
        } finally {
            setIsClassifying(false)
        }
    }

    return (
        <div className="space-y-4">
            {/* AI自動分類ボタン */}
            <div className="flex justify-between items-center">
                <Label>タグ管理</Label>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAIClassify}
                    disabled={isClassifying}
                    className="gap-2"
                >
                    {isClassifying ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            AI分析中...
                        </>
                    ) : (
                        <>
                            <Sparkles className="h-4 w-4" />
                            AIで自動分類
                        </>
                    )}
                </Button>
            </div>
            
            {/* 分類メッセージ */}
            {classificationMessage && (
                <div className={`text-sm p-2 rounded ${
                    classificationMessage.startsWith('✓') 
                        ? 'bg-green-50 text-green-700' 
                        : 'bg-red-50 text-red-700'
                }`}>
                    {classificationMessage}
                </div>
            )}

            {/* 現在のタグ */}
            <div>
                <Label>現在のタグ</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                    {tags.length === 0 ? (
                        <span className="text-sm text-muted-foreground">タグが設定されていません</span>
                    ) : (
                        tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="gap-1">
                                {TAG_LABELS[tag as PredefinedTag] || tag}
                                <button
                                    onClick={() => removeTag(tag)}
                                    className="ml-1 hover:text-destructive"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </Badge>
                        ))
                    )}
                </div>
            </div>

            {/* 推奨タグ */}
            <div>
                <Label>推奨タグ</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                    {PREDEFINED_TAGS.map((tag) => (
                        <Button
                            key={tag}
                            variant={tags.includes(tag) ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => tags.includes(tag) ? removeTag(tag) : addTag(tag)}
                        >
                            {TAG_LABELS[tag]}
                        </Button>
                    ))}
                </div>
            </div>

            {/* カスタムタグ追加 */}
            <div>
                <Label htmlFor="customTag">カスタムタグを追加</Label>
                <div className="flex gap-2 mt-2">
                    <Input
                        id="customTag"
                        value={customTag}
                        onChange={(e) => setCustomTag(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addCustomTag()}
                        placeholder="タグ名を入力"
                    />
                    <Button onClick={addCustomTag}>追加</Button>
                </div>
            </div>
        </div>
    )
}
