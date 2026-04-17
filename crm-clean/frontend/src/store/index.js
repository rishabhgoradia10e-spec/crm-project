import { configureStore, createSlice } from '@reduxjs/toolkit';

const slice = createSlice({
  name: 'interactions',
  initialState: { list: [], loading: false, selected: null },
  reducers: {
    setInteractions: (s, a) => { s.list = a.payload; },
    setLoading:      (s, a) => { s.loading = a.payload; },
    setSelected:     (s, a) => { s.selected = a.payload; },
  },
});

export const { setInteractions, setLoading, setSelected } = slice.actions;

export const store = configureStore({ reducer: { interactions: slice.reducer } });
