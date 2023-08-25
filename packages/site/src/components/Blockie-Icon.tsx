import Blockies from 'react-blockies';
import styled from 'styled-components';

const BlockieContainer = styled.div`
    .identicon {
        border-radius: 50%;
        width: 100%;
        height: 100%;
        margin-right: 1rem;
        background-size: cover;
        background-repeat: no-repeat;
        background-position: center;
        border: 1px solid ${({ theme }) => theme.colors.border.default};
    }
`;

const BlockieAccountContainer = styled.div`
    .identicon {
        border-radius: ${({ theme }) => theme.radii.default};
        margin-right: 1rem;
        background-size: cover;
        background-repeat: no-repeat;
        background-position: center;
        border: 1px solid ${({ theme }) => theme.colors.border.default};
    }
`;

export const BlockieEoa = () => (
    <BlockieContainer>
        <Blockies
            seed="Jeremy"
            size={12} 
            scale={4}
            color='#8e2791'
            bgColor="#c899c9"
            spotColor="#abc" 
            className="identicon"
        />
    </BlockieContainer>   
)

export const BlockieSc = () => (
    <BlockieContainer>
        <Blockies
            seed="Jeremy"
            size={12} 
            scale={4}
            color='#8e2791'
            bgColor="#c899c9"
            spotColor="#abc" 
            className="identicon"
        />
    </BlockieContainer>   
)

export const BlockieAccountModal = () => (
    <BlockieAccountContainer>
        <Blockies
            seed="Jeremy"
            size={5} 
            scale={4}
            color='#8e2791'
            bgColor="#c899c9"
            spotColor="#abc" 
            className="identicon"
        />
    </BlockieAccountContainer>   
)