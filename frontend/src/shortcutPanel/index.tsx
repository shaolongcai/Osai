import { useState } from 'react';
import styles from './index.module.scss';
import { Search, SearchPanel } from "@/components";



const SearchBar = () => {

    const [data, setData] = useState<shortSearchDataItem[]>([]); //搜索的结果

    // 快捷搜索
    const onSearch = async (keyword: string) => {
        const res = await window.electronAPI.shortSearch(keyword);
        console.log('快捷搜索', res);
        setData(res.data);
    }

    return <>
        <Search onSearch={onSearch} />
        {
            data.length > 0 &&
            <div className={styles.searchPanel}>
                <SearchPanel data={data} />
            </div>
        }
    </>
}

export default SearchBar;