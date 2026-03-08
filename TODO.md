# WebDAW TODO List

## Already done before this list was made
- [X] Add support for VST2 32bit plugins using v86
- [X] MIDI editor (piano roll): ~100% complete

## Bugfixes/small changes/quality of life improvements

- [X] Add length to note after creation
- [X] Fix pointer in redo/undo buffer
- [X] Stop/Resume + Delete button
- [X] Add velocity settings + copy/paste for piano roll
- [X] Fix playbar going woooo (+ fixed the x scrollbar showing only when scrolling to the end)
- [X] Delete note when it's scrolled doesn't work (And there was a lot of other issues)
- [X] Fix SongParts when there's a scrollbar
- [X] Do *NOT* unload views when closed
- [X] Adding a part on the SongPart doesn't check if overlapping with existing notes
- [X] Instrument part not deleting properly from Project
- [X] Ctrl+Z doesn't work in SongParts
- [ ] Add support for song playing (not only in the NoteCreator)
- [ ] Play bar isn't correctly placed at start (NoteCreator)
- [ ] NoteOff when stopped doesn't work
- [ ] CopyPaste remove preview sound + when ctrl+z

## Roadmap
- [X] Tracks + mixing (channels, ...). Maybe add some basic routing and other
- [ ] Add effects view + some built-in effects (reverb, delay, etc.)
- [ ] Add song general settings (length, tempo, etc.) + correct the song editor to match the song length
- [ ] Add support for "native" js plugin (with an API)
- [ ] Add support for saving/loading projects
- [ ] Add support for MIDI controllers (probably using WebMIDI API)
- [ ] Add loop
- [ ] Add a bunch of "pre-made" plugins (load mp3/wav, synth, etc...)

## Misc
- [ ] More documentation in code (especially function's comments)
- [ ] Optimize RAM usage (the problem is that it, idk where, loads the entire IndexedDB into RAM)