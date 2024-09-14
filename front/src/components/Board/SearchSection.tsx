import React, { useState } from "react";
import { Token } from '../../store/types';

interface SearchSectionProps {
    tokens: Token[];
    onTokenFound: (token: Token | null) => void;
}

const SearchSection: React.FC<SearchSectionProps> = ({ tokens, onTokenFound }) => {
    const [searchDigest, setSearchDigest] = useState("");

    const handleSearch = () => {
        const foundToken = tokens.find(token => token.digest === searchDigest);
        onTokenFound(foundToken || null);
    };

    return (
        <div className="search-section">
            <input
                type="text"
                placeholder="search for token"
                value={searchDigest}
                onChange={(e) => setSearchDigest(e.target.value)}
            />
            <button onClick={handleSearch}>search</button>
        </div>
    );
};

export default SearchSection;
