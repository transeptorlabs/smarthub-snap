import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { useAcount } from '../hooks';

const ModalWrapper = styled.div`
  position: fixed;
  display: flex;
  justify-content: center;
  align-items: center;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  justify-content: flex-end; 
  z-index: 1000;
`;

const ModalContent = styled.div`
  background-color: ${({ theme }) => theme.colors.background.default};
  position: absolute;
  border-radius: ${({ theme }) => theme.radii.default};
  box-shadow: ${({ theme }) => theme.shadows.default};
`;


export enum ModalType {
    Account = 'Account',
    Network = 'Network',
    Transaction = 'Transaction',
}

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  modalType: ModalType,
  buttonRef?: React.RefObject<HTMLButtonElement>;
  top?: number;
  right?: number;
};

export const Modal = ({
    isOpen, 
    onClose, 
    children,
    modalType,
    buttonRef,
    top,
    right,
}: ModalProps) => {

    const modalContentRef = useRef<HTMLDivElement>(null);
    const [modalPosition, setModalPosition] = useState({ top: 0, right: 0 });
    const { rejectAllPendingRequests } = useAcount();

    useEffect(() => {
        const handleOutsideClick = async (event: MouseEvent) => {
            if (modalContentRef.current && !modalContentRef.current.contains(event.target as Node)) {
                onClose();
                if (modalType === ModalType.Transaction) {
                    await rejectAllPendingRequests()
                }
            }    
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleOutsideClick);
        }

        return () => {
            document.removeEventListener('mousedown', handleOutsideClick);
        };
    }, [isOpen, onClose]);

    useEffect(() => {
        if (isOpen && buttonRef && buttonRef.current) {
            const buttonRect = buttonRef.current.getBoundingClientRect();
            const newTop = buttonRect.bottom;
            const newRight = buttonRect.right - buttonRect.width;
            setModalPosition({ top: top ? top : newTop, right: right ? right : newRight });
        }
    }, [isOpen, buttonRef]);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }

        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [isOpen]);

    if (!isOpen) {
        return null;
    }

    return (
    <ModalWrapper>
        <ModalContent style={{ ...modalPosition }} ref={modalContentRef}>
        {children}
        </ModalContent>
    </ModalWrapper>
    );
};