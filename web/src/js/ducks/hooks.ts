import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "./store";
import { createAsyncThunk } from "@reduxjs/toolkit";


export const useAppDispatch = () => useDispatch<AppDispatch>();



function useAppSelectorImpl<T>(
    selector: (state: RootState) => T,
    options?: any
): T {
    return useSelector<RootState, T>(
        (state) => {
            
            
            if (state == null) {
                try {
                    
                    
                    const safeState = {
                        options: {},
                        options_meta: {},
                        ui: { optionsEditor: {} },
                    } as RootState;
                    return selector(safeState);
                } catch {
                    
                    return undefined as T;
                }
            }
            try {
                return selector(state);
            } catch (error) {
                
                
                console.warn("Selector error in useAppSelector:", error);
                return undefined as T;
            }
        },
        options
    );
}

export const useAppSelector = useAppSelectorImpl as TypedUseSelectorHook<RootState>;

export type AppAsyncThunkConfig = {
    state: RootState;
    dispatch: AppDispatch;
};

export const createAppAsyncThunk =
    createAsyncThunk.withTypes<AppAsyncThunkConfig>();
