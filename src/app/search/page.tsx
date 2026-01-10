'use client';

import { useState } from 'react';
import Sidebar from '@/components/ui/Sidebar';
import PostForm from '@/components/ui/PostForm';
import Modal from '@/components/ui/Modal';
import JobBoard from '@/components/ui/JobBoard'; 
import { Search as SearchIcon, Filter, MapPin, Briefcase } from 'lucide-react';

const industries = [
  "農業", "林業", "漁業", 
  "職人・工芸", "建築・DIY", 
  "飲食・料理", "宿泊・観光", 
  "教育・福祉", "IT・Web", 
  "アート・デザイン", "その他"
];

const areaToPrefecture: { [key: string]: string[] } = {
  "北海道": ["北海道"],
  "東北": ["青森県","岩手県","宮城県","秋田県","山形県","福島県"],
  "関東": ["茨城県","栃木県","群馬県","埼玉県","千葉県","東京都","神奈川県"],
  "中部": ["新潟県","富山県","石川県","福井県","山梨県","長野県","岐阜県","静岡県","愛知県"],
  "近畿": ["三重県","滋賀県","京都府","大阪府","兵庫県","奈良県","和歌山県"],
  "中国": ["鳥取県","島根県","岡山県","広島県","山口県"],
  "四国": ["徳島県","香川県","愛媛県","高知県"],
  "九州": ["福岡県","佐賀県","長崎県","熊本県","大分県","宮崎県","鹿児島県","沖縄県"],
};

export default function SearchPage() {
    const [isPostFormOpen, setIsPostFormOpen] = useState(false);
    const [keyword, setKeyword] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
    const [selectedPrefectures, setSelectedPrefectures] = useState<string[]>([]);
    const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
    
    const toggleSelection = (list: string[], setter: (v: string[]) => void, value: string) => {
        if (list.includes(value)) setter(list.filter((v) => v !== value));
        else setter([...list, value]);
    };

    const prefecturesToShow = selectedAreas.flatMap(area => areaToPrefecture[area] || []);

    const calculateTargetLocation = () => {
        let targets: string[] = [...selectedPrefectures];
        selectedAreas.forEach(area => {
            const prefsInArea = areaToPrefecture[area] || [];
            const hasSpecificPrefSelected = prefsInArea.some(p => selectedPrefectures.includes(p));
            if (!hasSpecificPrefSelected) {
                targets = [...targets, ...prefsInArea];
            }
        });
        return Array.from(new Set(targets));
    };

    const targetLocation = calculateTargetLocation();

    const FilterButton = ({ label, selectedList, setter }: { label: string, selectedList: string[], setter: (v: string[]) => void }) => {
        const selected = selectedList.includes(label);
        return (
            <button
                onClick={() => toggleSelection(selectedList, setter, label)}
                className={`
                    px-3 py-1.5 border-2 text-sm transition-all m-1 whitespace-nowrap font-bold tracking-tight relative
                    ${selected 
                        ? "bg-gray-900 text-white border-gray-900 shadow-[inset_2px_2px_0px_rgba(255,255,255,0.2)] translate-y-[2px]" 
                        : "bg-white text-gray-900 border-gray-900 shadow-[inset_-2px_-2px_0px_rgba(0,0,0,0.1),inset_2px_2px_0px_#ffffff,2px_2px_0px_#000] hover:bg-gray-100 active:shadow-none active:translate-y-[2px]"
                    }
                `}
            >
                {selected && <span className="absolute left-1 top-1/2 -translate-y-1/2 text-[10px] opacity-50">▶</span>}
                <span className={selected ? "pl-2" : ""}>{label}</span>
            </button>
        );
    };

    return (
        <main className="flex w-full h-screen bg-gray-100 overflow-hidden flex-col md:flex-row font-pixel text-gray-900 select-none">
            
            <div className="flex-shrink-0 z-20">
                <Sidebar onPostClick={() => setIsPostFormOpen(true)} />
            </div>

            <div className="flex-grow relative z-0 overflow-y-auto pb-20 md:pb-0 bg-gray-100/50">
                <div className="max-w-6xl mx-auto p-6 md:p-8">
                    
                    <div className="mb-8 flex items-center gap-4 border-b-2 border-gray-900 pb-4 bg-transparent">
                        <div className="bg-gray-900 p-2 border-2 border-gray-900 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.1)]">
                            <SearchIcon className="text-white" size={28} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-gray-900 tracking-tighter drop-shadow-[2px_2px_0px_#fff]">
                                村を探索
                            </h1>
                            <p className="text-xs font-bold text-gray-500 mt-1 uppercase tracking-widest">
                                Explore Village / Search
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4 mb-8 relative z-10">
                         <div className="relative flex-grow group">
                            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none">
                                <SearchIcon size={18} />
                            </div>
                            <input
                                type="text"
                                placeholder="キーワード検索..."
                                value={keyword}
                                onChange={(e) => setKeyword(e.target.value)}
                                className="w-full h-[54px] p-3 pl-10 bg-white text-gray-900 border-2 border-gray-900 shadow-[inset_2px_2px_0px_rgba(0,0,0,0.1)] outline-none font-bold text-base placeholder:text-gray-400 focus:bg-green-50/50 transition-colors"
                            />
                        </div>
                        
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`
                                h-[54px] px-6 border-2 border-gray-900 font-bold transition-all flex items-center gap-2 text-sm shrink-0 justify-center
                                ${showFilters 
                                    ? "bg-gray-900 text-white shadow-[inset_3px_3px_0px_rgba(50,50,50,1)] translate-y-[2px]" 
                                    : "bg-white text-gray-900 shadow-[inset_-3px_-3px_0px_rgba(0,0,0,0.1),inset_3px_3px_0px_#fff,3px_3px_0px_#000] hover:bg-gray-50 active:shadow-none active:translate-y-[3px]"
                                }
                            `}
                        >
                            <Filter size={16} />
                            {showFilters ? '閉じる' : '絞り込み'}
                        </button>
                    </div>

                    {showFilters && (
                        <div className="relative mb-10 animate-in fade-in slide-in-from-top-2 duration-200 pl-1 pt-1">
                            <div className="relative bg-white border-2 border-gray-900 p-6 shadow-[4px_4px_0px_rgba(0,0,0,0.1)]">
                                <div className="absolute top-1 left-1 w-3 h-3 border-t-2 border-l-2 border-gray-900"></div>
                                <div className="absolute top-1 right-1 w-3 h-3 border-t-2 border-r-2 border-gray-900"></div>
                                <div className="absolute bottom-1 left-1 w-3 h-3 border-b-2 border-l-2 border-gray-900"></div>
                                <div className="absolute bottom-1 right-1 w-3 h-3 border-b-2 border-r-2 border-gray-900"></div>

                                <div className="space-y-6 px-2 py-1">
                                    {/* 業種カテゴリ */}
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2 uppercase tracking-tight border-b-2 border-gray-100 pb-1">
                                            <Briefcase size={16} /> 業種カテゴリ
                                        </h3>
                                        <div className="flex flex-wrap">
                                            {industries.map(industry => (
                                                <FilterButton key={industry} label={industry} selectedList={selectedIndustries} setter={setSelectedIndustries} />
                                            ))}
                                        </div>
                                    </div>

                                    {/* エリア */}
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2 uppercase tracking-tight border-b-2 border-gray-100 pb-1">
                                            <MapPin size={16} /> エリア
                                        </h3>
                                        <div className="flex flex-wrap mb-3">
                                            {Object.keys(areaToPrefecture).map(area => (
                                                <FilterButton key={area} label={area} selectedList={selectedAreas} setter={setSelectedAreas} />
                                            ))}
                                        </div>

                                        {prefecturesToShow.length > 0 && (
                                            <div className="mt-3 p-4 bg-gray-50 border-2 border-dashed border-gray-300 relative">
                                                <div className="absolute -top-3 left-4 bg-gray-50 px-2 text-xs font-bold text-gray-500">詳細エリア</div>
                                                <div className="flex flex-wrap">
                                                    {prefecturesToShow.map(pref => (
                                                        <FilterButton key={pref} label={pref} selectedList={selectedPrefectures} setter={setSelectedPrefectures} />
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="text-center pt-2">
                                        <button 
                                            onClick={() => setShowFilters(false)}
                                            className="text-xs font-bold text-gray-400 hover:text-gray-900 transition-colors uppercase tracking-widest"
                                        >
                                            ▲ Close Window ▲
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="mb-8">
                        <JobBoard 
                            searchQuery={keyword} 
                            filterLocation={targetLocation}
                            filterIndustries={selectedIndustries}
                        />
                    </div>
                </div>
            </div>

            <Modal isOpen={isPostFormOpen} onClose={() => setIsPostFormOpen(false)} title="Share Experience">
                <PostForm onClose={() => setIsPostFormOpen(false)} />
            </Modal>
        </main>
    );
}