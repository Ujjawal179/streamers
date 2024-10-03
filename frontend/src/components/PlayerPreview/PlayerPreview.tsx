import React from 'react';

interface PlayerPreviewProps {
    size: number;
    position: number;
}

const PlayerPreview: React.FC<PlayerPreviewProps> = ({ size, position }) => {

    const calculatedSize = 100 / size;
    const top = Math.floor((position - 1) / size) * 100 / size;
    const left = ((position - 1) % size) / size * 100;
    const style: React.CSSProperties = {
        position: 'absolute', 
        width: `${calculatedSize}%`,
        height: `${calculatedSize}%`,
        top: `${top}%`,
        left: `${left}%`,
        background: "rgb(221 221 221)",
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontSize: '1rem',
        color: 'black',
        borderRadius: 'inherit'
    };

    if (size > -1 && position > 0) {
        return (
            <div className="player-preview" style={{ margin:"auto" , width: '60%', position: 'relative', paddingTop: '20%', background: '#333333', minWidth: "288px", minHeight: '162px', borderRadius:"10px" ,border:"2px black solid" }}>
                <div className="player-preview__image" style={style}>Position {position}</div>
            </div>
        );
    }

    return null;
}

export default PlayerPreview;
