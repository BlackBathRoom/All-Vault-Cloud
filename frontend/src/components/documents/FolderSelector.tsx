import { CATEGORY_LABELS, type DocumentCategory } from '../../types/document'
import { Label } from '../ui/label'

interface FolderSelectorProps {
    folder?: string
    category?: DocumentCategory
    onFolderChange: (folder: string) => void
    onCategoryChange: (category: DocumentCategory) => void
}

const PREDEFINED_FOLDERS = [
    '請求書',
    '注文書',
    '契約書',
    '見積書',
    '領収書',
    '通知',
    '社内文書',
    'その他',
]

export function FolderSelector({ 
    folder, 
    category,
    onFolderChange, 
    onCategoryChange 
}: FolderSelectorProps) {

    return (
        <div className="space-y-4">
            {/* フォルダ選択 */}
            <div>
                <Label htmlFor="folder">フォルダ</Label>
                <select
                    id="folder"
                    value={folder || ''}
                    onChange={(e) => onFolderChange(e.target.value)}
                    className="w-full mt-2 px-3 py-2 border rounded-md"
                >
                    <option value="">フォルダを選択</option>
                    {PREDEFINED_FOLDERS.map((f) => (
                        <option key={f} value={f}>
                            {f}
                        </option>
                    ))}
                </select>
            </div>

            {/* カテゴリ選択 */}
            <div>
                <Label htmlFor="category">カテゴリ（自動分類）</Label>
                <select
                    id="category"
                    value={category || ''}
                    onChange={(e) => onCategoryChange(e.target.value as DocumentCategory)}
                    className="w-full mt-2 px-3 py-2 border rounded-md"
                >
                    <option value="">カテゴリを選択</option>
                    {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>
                            {label}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    )
}
