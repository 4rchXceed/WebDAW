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
- [X] Add support for song playing (not only in the NoteCreator)
- [X] Play bar isn't correctly placed at start (NoteCreator)
- [X] NoteOff when stopped doesn't work
- [X] CopyPaste remove preview sound + when ctrl+z
- [ ] Load 2 vsts one after another causes the second one to not load. (Lazy to do it rn)
- [X] Instrument's name not saving/loading properly

## Roadmap
- [X] Tracks + mixing (channels, ...). Maybe add some basic routing and other
- [CURRENT] Add effects view + some built-in effects (reverb, delay, etc.)
- [ ] Add song general settings (length, tempo, etc.) + correct the song editor to match the song length
- [ ] Add support for "native" js plugin (with an API)
- [ ] Add support for saving/loading projects
- [ ] Add support for MIDI controllers (probably using WebMIDI API)
- [ ] Add loop
- [ ] Add a bunch of "pre-made" plugins (load mp3/wav, synth, etc...)

## Misc
- [ ] Add a simple "settings" getter/setter system. For example (static): Settings.get("mixer.showMasterChannel") -> true/false, and Settings.set("mixer.showMasterChannel", false) 
- [ ] Add Ctrl+Z+Y support for: Mixer, not yet implemented because mixer doesn't save his state, the audioManager does it.
- [ ] "Spread" the event/bus system to the entire app (currently only used by some parts)
- [ ] MAYBE: use static instance() instead of global webDaw variable (not sure if it's better or not, but it would be cleaner)
- [ ] More documentation in code (especially function's comments)
- [ ] Optimize RAM usage (the problem is that it, idk where, loads the entire IndexedDB into RAM -> i know: it's Db.js)
- [ ] Add tests?

## Architectural changes
- [ ] MAYBEMAYBEMAYBE (1% sure): Use typescript.

## Improvements in future versions
- [ ] Add "song or pattern" mode (currently only pattern mode is supported on the notes view, and song view, only for the song parts, it would be better if we could switch between the two modes on both views, and not have the song view only for the song parts)