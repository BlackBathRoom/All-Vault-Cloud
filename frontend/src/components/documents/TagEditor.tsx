import { useState } from 'react'
import { X } from 'lucide-react'
import { PREDEFINED_TAGS, TAG_LABELS, type PredefinedTag } from '../../types/document'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Input } from '../ui/input'
import { Label } from '../ui/label'

interface TagEditorProps {
    tags: string[]
    onTagsChange: (tags: string[]) => void
}

export function TagEditor({ tags, onTagsChange }: TagEditorProps) {
    const [customTag, setCustomTag] = useState('')

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

    return (
        <div className="space-y-4">
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
