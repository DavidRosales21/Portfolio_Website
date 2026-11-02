/**
 * This site's background scenes (CLAUDE.md §7.2). Loaded only on pages that use <Backdrop>.
 */
import { mountBackdrops } from './backdrop';
import { dots } from './backdrops/dots';

mountBackdrops({ dots });
