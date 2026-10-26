"""Builds the rider's wardrobe for the character customiser and exports public/models/wardrobe.glb.

Run with:  python art/build_wardrobe.py   (needs the `bpy` package, like build_assets.py)

Every piece is named `<slot>__<style>` (e.g. `hair__ponytail`, `torso__tee`) and has its origin
at the joint it hangs from, hanging down -Z, exactly like the skater's parts in skater.glb
(see src/skater.ts), so src/look.ts can dress a joint with any of them. Head pieces are
already scaled up like the skater's head (HEAD_SCALE).

Materials are named for the colour slot they take at runtime (src/look.ts): `skin`, `hair`,
`top`, `top_dark`, `bottom`, `hat`, ... Faces that can take a printed pattern have UVs in
metres (u around the body, v up it), so a pattern tile is the same size on every piece.
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy  # noqa: E402
import bmesh  # noqa: E402
from mathutils import Vector, Matrix  # noqa: E402
from build_assets import (  # noqa: E402
    OUT, mat, reset, finish, apply_tf, cube, sphere, cyl, capsule, join, loft, surface_y,
    skull, hand, cap_parts, beanie_parts, build_board, helmet_parts, skate_helmet_parts, fullface_parts,
)

HEAD_SCALE = 1.08
CZ = 0.16  # skull centre height above the neck pivot


# ---------------------------------------------------------------- helpers

def mesh_obj(name, bm, material, smooth=True):
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(o)
    return finish(o, material, smooth)


def solidify(o, t, offset=-1.0):
    m = o.modifiers.new('sol', 'SOLIDIFY')
    m.thickness = t
    m.offset = offset
    bpy.context.view_layer.objects.active = o
    bpy.ops.object.modifier_apply(modifier='sol')
    return o


def cut(o, kill):
    """Delete the vertices of o for which kill(co) is true."""
    bm = bmesh.new()
    bm.from_mesh(o.data)
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if kill(v.co)], context='VERTS')
    bm.to_mesh(o.data)
    bm.free()
    return o


def frames(points):
    """A rotation-minimising frame (tangent, normal, binormal) at each point of a polyline."""
    pts = [Vector(p) for p in points]
    tans = []
    for i in range(len(pts)):
        a, b = pts[max(0, i - 1)], pts[min(len(pts) - 1, i + 1)]
        tans.append((b - a).normalized())
    up = Vector((0, 0, 1)) if abs(tans[0].z) < 0.9 else Vector((1, 0, 0))
    n = tans[0].cross(up).normalized()
    out = []
    for i, t in enumerate(tans):
        if i:
            n = (n - t * n.dot(t)).normalized()
        out.append((pts[i], t, n, t.cross(n).normalized()))
    return out


def tube(material, points, radii, segs=14, cap0=True, cap1=True, squash=1.0, name='tube'):
    """A tube swept along a polyline, radius per point (squash flattens it along the binormal)."""
    bm = bmesh.new()
    rings = []
    for (p, t, n, b), r in zip(frames(points), radii):
        ring = []
        for k in range(segs):
            a = 2 * math.pi * k / segs
            ring.append(bm.verts.new(p + n * (r * math.cos(a)) + b * (r * squash * math.sin(a))))
        rings.append(ring)
    for ra, rb in zip(rings, rings[1:]):
        for k in range(segs):
            bm.faces.new((ra[k], ra[(k + 1) % segs], rb[(k + 1) % segs], rb[k]))
    if cap0:
        c = bm.verts.new(Vector(points[0]))
        for k in range(segs):
            bm.faces.new((rings[0][(k + 1) % segs], rings[0][k], c))
    if cap1:
        c = bm.verts.new(Vector(points[-1]))
        for k in range(segs):
            bm.faces.new((rings[-1][k], rings[-1][(k + 1) % segs], c))
    return mesh_obj(name, bm, material)


def bezier(p0, p1, p2, n):
    out = []
    for i in range(n + 1):
        t = i / n
        out.append(tuple((1 - t) ** 2 * p0[k] + 2 * (1 - t) * t * p1[k] + t * t * p2[k] for k in range(3)))
    return out


def phi(co):
    """Angle round the head from the front (0, the face is at -Y) to the back (+-pi)."""
    return math.atan2(co.x, -co.y)


def uv_wrap(o, material_names, around=8, tile=0.125, axis='z', centre=(0, 0)):
    """UVs in metres for faces with the given materials: u round the axis (front centre = 0), v along it.

    In tiles of about `tile` metres: u is stretched so that exactly `around` tiles fit round,
    hiding the seam at the back.
    """
    me = o.data
    if not me.uv_layers:
        me.uv_layers.new(name='UVMap')
    uv = me.uv_layers[0].data
    idx = {i for i, m in enumerate(me.materials) if m and m.name in material_names}
    cx, cy = centre
    for poly in me.polygons:
        if poly.material_index not in idx:
            continue
        pts = []
        for li in poly.loop_indices:
            co = me.vertices[me.loops[li].vertex_index].co
            if axis == 'z':
                a = math.atan2(co.x - cx, -(co.y - cy))
                r = math.hypot(co.x - cx, co.y - cy)
                h = co.z
            else:  # along x (a limb lying along x is not used, keep for completeness)
                a = math.atan2(co.y, co.z)
                r = math.hypot(co.y, co.z)
                h = co.x
            pts.append((li, a, r, h))
        # Keep a face from straddling the seam at the back.
        if max(p[1] for p in pts) - min(p[1] for p in pts) > math.pi:
            pts = [(li, a + 2 * math.pi if a < 0 else a, r, h) for li, a, r, h in pts]
        for li, a, r, h in pts:
            uv[li].uv = (a / (2 * math.pi) * around, h / tile)


def uv_plane(o, material_names, size, offset=(0, 0), axes='xz'):
    """Flat UVs 0..1 over a rectangle `size` centred on `offset`, for printed pictures."""
    me = o.data
    if not me.uv_layers:
        me.uv_layers.new(name='UVMap')
    uv = me.uv_layers[0].data
    idx = {i for i, m in enumerate(me.materials) if m and m.name in material_names}
    ia, ib = 'xyz'.index(axes[0]), 'xyz'.index(axes[1])
    for poly in me.polygons:
        if poly.material_index not in idx:
            continue
        for li in poly.loop_indices:
            co = me.vertices[me.loops[li].vertex_index].co
            uv[li].uv = ((co[ia] - offset[0]) / size[0] + 0.5, (co[ib] - offset[1]) / size[1] + 0.5)


def dye(o, tips, below):
    """Dyed ends: faces lower than `below` take the tips material."""
    me = o.data
    me.materials.append(tips)
    k = len(me.materials) - 1
    for p in me.polygons:
        if p.center.z < below:
            p.material_index = k
    return o


def head_piece(name, objs):
    """Join head bits and scale them like the skater's head."""
    o = join(name, objs)
    o.scale = (HEAD_SCALE,) * 3
    apply_tf(o)
    return o


def mirror_x(o):
    o.scale = (-1, 1, 1)
    apply_tf(o)
    bpy.context.view_layer.objects.active = o
    o.select_set(True)
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.mesh.flip_normals()
    bpy.ops.object.mode_set(mode='OBJECT')
    return o


def dup(o):
    c = o.copy()
    c.data = o.data.copy()
    bpy.context.collection.objects.link(c)
    return c


# ---------------------------------------------------------------- head and face

def head_base(skin, eye, white, brow):
    """Skull, ears, nose, eyes and brows: the head without its mouth, hair or hat."""
    sk = skull(skin)
    out = [sk]
    for s in (1, -1):
        x = s * 0.043
        y = surface_y(sk, x, 0.152)
        out.append(sphere(eye, 0.02, loc=(x, y + 0.006, 0.152), scale=(0.85, 0.5, 1.25), segs=12, rings=8))
        out.append(sphere(white, 0.0055, loc=(x - 0.006, y - 0.004, 0.164), segs=8, rings=4))
        yb = surface_y(sk, s * 0.047, 0.186)
        out.append(cube(brow, (0.04, 0.014, 0.011), loc=(s * 0.047, yb - 0.001, 0.186), rot=(0, s * 0.15, 0), bevel=0.005))
    yn = surface_y(sk, 0, 0.135)
    out.append(sphere(skin, 0.02, loc=(0, yn - 0.006, 0.133), scale=(0.8, 0.9, 1.0), segs=12, rings=8))
    for s in (1, -1):
        out.append(sphere(skin, 0.03, loc=(s * 0.118, 0.005, 0.15), scale=(0.45, 0.9, 1.15), segs=12, rings=8))
    neck = cyl(skin, 0.05, 0.08, loc=(0, 0.005, 0.03), verts=14)
    out.append(neck)
    return sk, out


def mouths(sk, mouth, teeth, tongue):
    """Smile, big grin, tongue out and a cheeky half smile."""
    def beads(curve, n=13, r=0.0052):
        bs = []
        for i in range(n):
            u = (i - (n - 1) / 2) / ((n - 1) / 2)
            x, z = curve(u)
            bs.append(sphere(mouth, r, loc=(x, surface_y(sk, x, z) + 0.002, z), scale=(1.2, 0.7, 1), segs=8, rings=4))
        return bs
    out = {}
    out['smile'] = beads(lambda u: (u * 0.026, 0.092 + 0.008 * u * u))
    out['cheeky'] = beads(lambda u: (0.006 + u * 0.024, 0.093 + 0.011 * max(0, u) ** 2 + 0.003 * u))
    # Grin: an open D, dark inside with a row of teeth along the top.
    def open_mouth(w, h, z0):
        bm = bmesh.new()
        n = 14
        pts = []
        for i in range(n + 1):
            a = math.pi * i / n
            pts.append((-math.cos(a) * w, z0 - math.sin(a) * h))
        ring = []
        for x, z in pts:
            ring.append(bm.verts.new((x, surface_y(sk, x, z) - 0.0015, z)))
        c = bm.verts.new((0, surface_y(sk, 0, z0 - h * 0.4) - 0.0015, z0 - h * 0.4))
        for a, b in zip(ring, ring[1:]):
            bm.faces.new((a, b, c))
        bm.faces.new((ring[-1], ring[0], c))
        o = mesh_obj('mouth', bm, mouth)
        return solidify(o, 0.003, 1)
    grin = [open_mouth(0.03, 0.022, 0.104)]
    grin.append(cube(teeth, (0.044, 0.006, 0.007), loc=(0, surface_y(sk, 0, 0.1) - 0.0035, 0.1), bevel=0.002))
    out['grin'] = grin
    tng = beads(lambda u: (u * 0.024, 0.094 + 0.006 * u * u), n=11)
    tng.append(sphere(tongue, 0.013, loc=(0.004, surface_y(sk, 0.004, 0.085) - 0.004, 0.085), scale=(1, 0.55, 1.15), segs=12, rings=8))
    out['tongue'] = tng
    return out


def face_extras(sk, freckle, blush, lash):
    out = {}
    fr = []
    for s in (1, -1):
        for dx, dz in ((0.0, 0.0), (0.012, 0.006), (0.022, -0.002), (0.008, -0.01), (-0.008, -0.004), (0.018, 0.011)):
            x, z = s * (0.05 + dx), 0.125 + dz
            fr.append(sphere(freckle, 0.0028, loc=(x, surface_y(sk, x, z) + 0.0012, z), scale=(1, 0.5, 1), segs=6, rings=4))
    out['freckles'] = fr
    out['cheeks'] = [sphere(blush, 0.017, loc=(s * 0.062, surface_y(sk, s * 0.062, 0.118) + 0.004, 0.118), scale=(1.25, 0.35, 0.8), segs=12, rings=6)
                     for s in (1, -1)]
    ls = []
    for s in (1, -1):
        for k in range(3):
            a = 0.5 + k * 0.45
            x0, z0 = s * (0.043 + 0.016 * math.sin(a)), 0.152 + 0.024 * math.cos(a)
            y0 = surface_y(sk, x0, z0) + 0.003
            ls.append(tube(lash, [(x0, y0, z0), (x0 + s * 0.008 * math.sin(a), y0 - 0.004, z0 + 0.01 * math.cos(a) + 0.003)],
                           [0.0022, 0.0012], segs=5))
    out['lashes'] = ls
    return out


def glasses(sk, frame, lens):
    """Round specs, sunnies, star and heart shades. Lenses sit just in front of the eyes."""
    out = {}
    z = 0.155
    yf = surface_y(sk, 0.043, z) - 0.02  # front of the frames

    def arms():
        return [tube(frame, [(s * 0.075, yf + 0.004, z + 0.01), (s * 0.118, yf + 0.03, z + 0.012), (s * 0.122, 0.03, z + 0.01)],
                     [0.0035] * 3, segs=6) for s in (1, -1)]

    def shape_lens(outline, cx, scale, lens_m):
        """A flat lens from a 2D outline (x, z around 0), with a frame tube round it."""
        bm = bmesh.new()
        ring = [bm.verts.new((cx + x * scale, yf, z + zz * scale)) for x, zz in outline]
        c = bm.verts.new((cx, yf + 0.001, z))
        for a, b in zip(ring, ring[1:] + ring[:1]):
            bm.faces.new((a, b, c))
        le = solidify(mesh_obj('lens', bm, lens_m), 0.004, 0)
        rim = tube(frame, [(cx + x * scale, yf, z + zz * scale) for x, zz in outline + outline[:1]], [0.0035] * (len(outline) + 1), segs=6, cap0=False, cap1=False)
        return [le, rim]

    circle = [(math.cos(2 * math.pi * k / 24), math.sin(2 * math.pi * k / 24)) for k in range(24)]
    star = []
    for k in range(10):
        a = math.pi / 2 + 2 * math.pi * k / 10
        r = 1.0 if k % 2 == 0 else 0.48
        star.append((math.cos(a) * r, math.sin(a) * r))
    heart = []
    for k in range(28):
        t = 2 * math.pi * k / 28
        x = 16 * math.sin(t) ** 3
        y = 13 * math.cos(t) - 5 * math.cos(2 * t) - 2 * math.cos(3 * t) - math.cos(4 * t)
        heart.append((x / 17, (y + 2) / 17))
    rect = []
    for k in range(24):
        t = 2 * math.pi * k / 24
        c, s = math.cos(t), math.sin(t)
        rect.append((math.copysign(abs(c) ** 0.5, c) * 1.15, math.copysign(abs(s) ** 0.5, s) * 0.8))
    bridge = lambda: tube(frame, [(-0.018, yf - 0.002, z + 0.006), (0, yf - 0.004, z + 0.01), (0.018, yf - 0.002, z + 0.006)], [0.003] * 3, segs=6)
    clear = mat('glasses_clear', (210, 235, 255))
    for name, outline, sc, lm in (('round', circle, 0.024, clear), ('sun', rect, 0.023, lens), ('star', star, 0.032, lens), ('heart', heart, 0.03, lens)):
        bits = arms() + [bridge()]
        for s in (1, -1):
            bits += shape_lens(outline, s * 0.044, sc, lm)
        out[name] = bits
    return out


# ---------------------------------------------------------------- hair

def hairline(f, s, b):
    """Hair edge height round the head: f at the front, s at the sides, b at the back."""
    def z(co):
        a = phi(co)
        c = math.cos(a)
        # Up and over the ears.
        ear = 0.045 * math.exp(-((abs(a) - 1.62) / 0.3) ** 2)
        return s + (f - s) * max(0.0, c) + (b - s) * max(0.0, -c) + ear
    return z


def shell(hair, line, r=0.129, scale=(0.97, 1.03, 1.07), t=0.006, flare=0.0, segs=40, rings=18, part=False):
    """Hair over the skull, its edge exactly on `line` all round (a function of phi(co)).

    Above the skull's middle it follows the skull; an edge lower than that hangs straight down
    from there (a bob, long hair), splaying out by `flare` per 10 cm of drop.
    `part` dents a centre parting down the middle of the top.
    """
    rx, ry, rz = r * scale[0], r * scale[1], r * scale[2]
    bm = bmesh.new()
    cols = []
    for k in range(segs):
        ph = -math.pi + 2 * math.pi * (k + 0.5) / segs
        dx, dy = math.sin(ph), -math.cos(ph)
        zl = line(Vector((dx, dy, 0)))
        col = []
        # Arc length split between the dome (top to the edge, or to the middle) and the drop.
        cos_end = max(-0.0, min(1.0, (zl - CZ) / rz))
        th_end = math.acos(cos_end)
        drop = max(0.0, CZ - zl)
        n_dome = rings if drop == 0 else max(4, int(rings * (th_end * r) / (th_end * r + drop)))
        for i in range(n_dome + 1):
            th = th_end * i / n_dome
            dent = 1 - (0.06 * math.exp(-(ph / 0.12) ** 2 if abs(ph) < 1.6 else -99) * math.sin(th) if part else 0)
            col.append((rx * math.sin(th) * dx * dent, ry * math.sin(th) * dy * dent, CZ + rz * math.cos(th)))
        if drop:
            n = rings - n_dome
            for i in range(1, n + 1):
                d = drop * i / n
                k_out = 1 + flare * d / 0.1
                col.append((rx * dx * k_out, ry * dy * k_out, CZ - d))
        cols.append(col)
    # Columns may have different lengths: resample each to the same count.
    n = max(len(c) for c in cols)
    def at(c, u):
        x = u * (len(c) - 1)
        i = min(int(x), len(c) - 2)
        f = x - i
        return tuple(c[i][j] * (1 - f) + c[i + 1][j] * f for j in range(3))
    grid = [[bm.verts.new(at(c, i / (n - 1))) for i in range(n)] for c in cols]
    for k in range(segs):
        a, b = grid[k], grid[(k + 1) % segs]
        for i in range(n - 1):
            bm.faces.new((a[i], b[i], b[i + 1], a[i + 1]))
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-6)
    o = mesh_obj('hair', bm, hair)
    return solidify(o, t)


# Hats cover everything above this line, so hair under a hat stops there.
UNDER = lambda co: co.z > 0.222 - 0.035 * max(0.0, co.y) / 0.137 - 0.004


def on_head(r, theta, ph, lift=0.0):
    """A point on a sphere of radius r round the skull centre: theta from the top, ph from the front."""
    return Vector((r * math.sin(theta) * math.sin(ph), -r * math.sin(theta) * math.cos(ph) * 1.03, CZ + r * math.cos(theta) * 1.05 + lift))


def ties(hair_tie, at, axis):
    """A hair tie (a short fat ring) at `at`, its hole along `axis`."""
    a = Vector(axis).normalized()
    p = Vector(at)
    return tube(hair_tie, [tuple(p - a * 0.008), tuple(p + a * 0.008)], [0.024, 0.024], segs=14)


def hair_styles(hair, hair_tie, tips):
    """Each style as (pieces that stay under a hat, pieces only worn without one).

    Shells are made twice: whole for no hat, and cut at the hat line for under one.
    `tips` is the dyed-tips material, used by the ends of long hair.
    """
    styles = {}

    def two(line, **kw):
        full = shell(hair, line, **kw)
        under = cut(dup(full), UNDER)
        return full, under

    # Buzz cut: short all over.
    full, under = two(hairline(0.218, 0.15, 0.085), r=0.127, scale=(0.965, 1.02, 1.05), t=0.004)
    styles['buzz'] = ([under], [full])

    # Short crop with a little quiff at the front.
    full, under = two(hairline(0.208, 0.14, 0.08))
    quiff = [sphere(hair, 0.045, loc=(x, -0.085, 0.262 - abs(x) * 0.3), scale=(1.1, 0.8, 0.55), segs=14, rings=8) for x in (-0.035, 0.0, 0.04)]
    styles['crop'] = ([under], [full] + quiff)

    # Spiky: crop with spikes all over the top.
    full, under = two(hairline(0.208, 0.14, 0.08))
    spikes = []
    for i, (th, ph) in enumerate([(0.15, 0), (0.45, 0), (0.45, 1.2), (0.45, -1.2), (0.5, 2.4), (0.5, -2.4), (0.8, 0.3), (0.8, -0.5),
                                  (0.85, 1.6), (0.85, -1.6), (0.9, 2.6), (0.9, -2.6), (0.4, 3.1), (0.85, 3.14)]):
        base = on_head(0.12, th, ph)
        out = (base - Vector((0, 0, CZ))).normalized()
        out = (out + Vector((0, 0.35, 0.5))).normalized()
        L = 0.07 if th < 0.6 else 0.055
        spikes.append(cyl(hair, 0.03, L, loc=tuple(base + out * L / 2), r2=0.002, verts=8,
                          rot=Vector((0, 0, 1)).rotation_difference(out).to_euler()))
    styles['spiky'] = ([under], [full] + spikes)

    # Curly: little curls all over, and a few peeking out under a hat.
    full, under = two(hairline(0.205, 0.13, 0.07), r=0.131)
    curls_top, curls_low = [], []
    import random
    rnd = random.Random(7)
    for i in range(70):
        th = math.acos(1 - 2 * (i + 0.5) / 140)  # top half, evenly spread
        ph = i * 2.39996
        p = on_head(0.138, th, ph)
        if p.z < hairline(0.21, 0.13, 0.07)(p) + 0.01:
            continue
        r = 0.026 + 0.008 * rnd.random()
        c = sphere(hair, r, loc=tuple(p), segs=10, rings=6)
        (curls_low if UNDER(p) is False else curls_top).append(c)
    styles['curly'] = ([under] + curls_low, [full] + curls_top)

    # Afro puffs: hair pulled back, two big round puffs on top.
    full, under = two(hairline(0.215, 0.14, 0.085), r=0.128, t=0.004)
    puffs = []
    for s in (1, -1):
        c = Vector((s * 0.095, 0.03, 0.285))
        for k in range(9):
            a = k * 2.39996
            h = 1 - 2 * (k + 0.5) / 9
            q = Vector((math.cos(a) * math.sqrt(1 - h * h), math.sin(a) * math.sqrt(1 - h * h), h)) * 0.045
            puffs.append(sphere(hair, 0.045, loc=tuple(c + q), segs=12, rings=8))
        puffs.append(sphere(hair, 0.06, loc=tuple(c), segs=14, rings=10))
        puffs.append(ties(hair_tie, (s * 0.08, 0.02, 0.24), (s * 0.4, 0.1, 1)))
    styles['puffs'] = ([under], [full] + puffs)

    # Bob: down to the jaw all round, with a fringe.
    def low_line(low, back=None):
        back = low if back is None else back
        def z(co):
            a = abs(phi(co))
            bottom = low + (back - low) * max(0.0, (a - 1.6) / (math.pi - 1.6))
            return 0.205 + (bottom - 0.205) * min(1.0, max(0.0, (a - 0.75) / 0.3)) ** 0.7
        return z
    full = shell(hair, low_line(0.06, 0.05), r=0.135, scale=(0.98, 1.04, 1.06), t=0.007, flare=0.15)
    under = cut(dup(full), UNDER)
    styles['bob'] = ([dye(under, tips, 0.085)], [dye(full, tips, 0.085)])

    # Ponytail: pulled back to a tie at the back, the tail swinging down behind.
    full, under = two(hairline(0.212, 0.14, 0.08), r=0.128, t=0.005)
    tail_pts = bezier((0, 0.13, 0.205), (0, 0.27, 0.2), (0, 0.22, -0.02), 10)
    tail = dye(tube(hair, tail_pts, [0.03, 0.042, 0.045, 0.043, 0.04, 0.036, 0.031, 0.026, 0.02, 0.013, 0.004], segs=14), tips, 0.08)
    tie = ties(hair_tie, (0, 0.135, 0.205), (0, 1, 0.1))
    styles['ponytail'] = ([under, tail, tie], [full, tail, tie])

    # High bun on top.
    full, under = two(hairline(0.212, 0.14, 0.08), r=0.128, t=0.005)
    bun = sphere(hair, 0.06, loc=(0, 0.05, 0.315), scale=(1, 1, 0.85), segs=16, rings=10)
    styles['bun'] = ([under], [full, bun, ties(hair_tie, (0, 0.04, 0.27), (0, 0.3, 1))])

    # Pigtails: a tie each side behind the ears, bunches hanging down and out.
    full, under = two(hairline(0.21, 0.14, 0.08), r=0.129, t=0.005)
    pig = []
    for s in (1, -1):
        pts = bezier((s * 0.118, 0.035, 0.215), (s * 0.23, 0.05, 0.2), (s * 0.21, 0.06, 0.04), 8)
        pig.append(dye(tube(hair, pts, [0.03, 0.044, 0.05, 0.05, 0.046, 0.04, 0.031, 0.018, 0.004], segs=14), tips, 0.1))
        pig.append(ties(hair_tie, (s * 0.125, 0.035, 0.215), (s, 0.1, 0.15)))
    styles['pigtails'] = ([under] + pig, [full] + pig)

    # Long and straight: a fringe, down past the shoulders at the back.
    full = shell(hair, low_line(0.0, -0.17), r=0.135, scale=(0.98, 1.04, 1.06), t=0.008, flare=0.12, rings=24)
    under = cut(dup(full), UNDER)
    styles['long'] = ([dye(under, tips, -0.07)], [dye(full, tips, -0.07)])

    # Two braids down the back, with tied ends.
    full, under = two(hairline(0.21, 0.14, 0.08), r=0.129, t=0.005)
    br = []
    for s in (1, -1):
        pts = bezier((s * 0.09, 0.1, 0.12), (s * 0.13, 0.17, 0.0), (s * 0.12, 0.15, -0.16), 9)
        for i, p in enumerate(pts[:-1]):
            q = Vector(pts[i + 1])
            off = Vector((0.012 * (1 if i % 2 else -1), 0, 0))
            br.append(sphere(hair, 0.026 - 0.001 * i, loc=tuple((Vector(p) + q) / 2 + off), scale=(1, 0.85, 1.25), segs=10, rings=6))
        br.append(ties(hair_tie, pts[-1], (0, 0, 1)))
        br.append(cyl(tips, 0.016, 0.04, loc=(pts[-1][0], pts[-1][1], pts[-1][2] - 0.025), r2=0.006, verts=10))
    styles['braids'] = ([under] + br, [full] + br)

    # Mohawk: shaved sides, a fin of spikes down the middle.
    full, under = two(hairline(0.22, 0.17, 0.09), r=0.126, scale=(0.965, 1.02, 1.05), t=0.003)
    fin = []
    for i in range(7):
        th = 0.5 - i * 0.33
        base = Vector((0, -0.125 * math.sin(th) * 1.03, CZ + 0.131 * math.cos(th)))
        out = (base - Vector((0, 0, CZ))).normalized()
        out = (out + Vector((0, 0.25, 0.3))).normalized()
        L = 0.085 - abs(i - 2.5) * 0.008
        fin.append(cyl(tips if i % 2 else hair, 0.034, L, loc=tuple(base + out * L / 2), r2=0.003, verts=8,
                       rot=Vector((0, 0, 1)).rotation_difference(out).to_euler()))
        # Flatten the spikes into a fin.
        fin[-1].scale = (0.45, 1, 1)
        apply_tf(fin[-1])
    styles['mohawk'] = ([under], [full] + fin)
    return styles


# ---------------------------------------------------------------- hats

def hats(hat, hat_dark, hat_trim, horn):
    out = {}
    out['cap'] = cap_parts(hat)

    dome = sphere(hat, 0.138, loc=(0, 0, 0.16), scale=(0.97, 1.02, 1.12), segs=28, rings=16)
    cut(dome, lambda co: co.z < 0.2)
    out['beanie'] = [dome, cyl(hat_dark, 0.142, 0.04, loc=(0, 0, 0.212), verts=28, bevel=0.01),
                     sphere(hat_trim, 0.038, loc=(0, 0.01, 0.318), segs=14, rings=10)]

    # Bucket hat: a soft crown and a brim sloping down all round.
    crown = sphere(hat, 0.142, loc=(0, 0, 0.18), scale=(0.98, 1.04, 0.95), segs=28, rings=16)
    cut(crown, lambda co: co.z < 0.215)
    brim = cyl(hat, 0.205, 0.05, loc=(0, 0.005, 0.2), r2=0.145, verts=32)
    cut(brim, lambda co: co.z > 0.22)
    brim = solidify(brim, 0.008, 0)
    out['bucket'] = [crown, brim, cyl(hat_dark, 0.144, 0.026, loc=(0, 0.005, 0.232), verts=28)]

    # Headband: a wide soft band over the top of the head, ear to ear.
    out['headband'] = [tube(hat, [(0.138 * math.sin(a), -0.03 - 0.015 * math.cos(a), CZ + 0.138 * math.cos(a) * 1.06) for a in [(-1.35 + 2.7 * k / 20) for k in range(21)]],
                            [0.018] * 21, segs=10, squash=0.3)]

    # Bandana: tight over the top, knotted at the back with two tails.
    dome = sphere(hat, 0.135, loc=(0, 0, 0.16), scale=(0.97, 1.04, 1.08), segs=28, rings=16)
    cut(dome, lambda co: co.z < 0.21 - 0.09 * max(0.0, co.y) / 0.14)
    dome = solidify(dome, 0.004, 1)
    knot = sphere(hat, 0.022, loc=(0, 0.14, 0.13), segs=10, rings=6)
    tails = [tube(hat, bezier((0, 0.145, 0.13), (s * 0.03, 0.18, 0.09), (s * 0.05, 0.17, 0.04), 4), [0.016, 0.02, 0.022, 0.02, 0.012], segs=8, squash=0.35)
             for s in (1, -1)]
    out['bandana'] = [dome, knot] + tails

    # Cat ears on a thin band.
    def ears(inner, size=1.0, ph=0.85):
        bits = []
        for sd in (1, -1):
            base = on_head(0.135, 0.62, sd * ph)
            out_dir = (base - Vector((0, 0, CZ))).normalized()
            up = (out_dir + Vector((0, 0, 1.2))).normalized()
            rot = Vector((0, 0, 1)).rotation_difference(up).to_euler()
            for m, r, h, fwd in ((hat, 0.05, 0.07, 0.0), (inner, 0.032, 0.05, -0.006)):
                e = cyl(m, r * size, h * size, loc=(0, 0, 0), r2=0.004, verts=3, rot=(0, 0, math.pi / 2))
                e.scale = (1, 0.45, 1)
                apply_tf(e)
                e.rotation_euler = rot
                e.location = tuple(base + up * (h * size / 2 - 0.01) + Vector((0, fwd, 0)))
                apply_tf(e)
                bits.append(e)
        return bits
    thin = lambda: tube(hat, [(0.137 * math.sin(a), 0.01 - 0.02 * math.cos(a), CZ + 0.137 * math.cos(a) * 1.05) for a in [(-1.3 + 2.6 * k / 16) for k in range(17)]],
                        [0.008] * 17, segs=8)
    out['catears'] = [thin()] + ears(hat_trim)

    # Unicorn: a golden striped horn over the forehead and little ears.
    base = on_head(0.13, 0.42, 0)
    up = (base - Vector((0, 0, CZ))).normalized() + Vector((0, 0, 0.9))
    up.normalize()
    hn = []
    L, n = 0.15, 6
    for k in range(n):
        p0, p1 = base + up * (L * k / n), base + up * (L * (k + 1) / n)
        hn.append(tube(horn if k % 2 == 0 else hat_trim, [tuple(p0), tuple(p1)], [0.036 * (1 - k / n) + 0.002, 0.036 * (1 - (k + 1) / n) + 0.002], segs=12))
    out['unicorn'] = [thin()] + hn + ears(hat, 0.7, 1.05)
    return out


# ---------------------------------------------------------------- tops

HOODIE = [
    (-0.005, 0.182, 0.12, 0.01, 0.0, 2.6), (0.08, 0.172, 0.114, 0.005, 0.0, 2.6), (0.18, 0.168, 0.112, 0, -0.004, 2.6),
    (0.3, 0.182, 0.118, 0, -0.008, 2.6), (0.37, 0.19, 0.114, 0, -0.004, 2.8), (0.42, 0.178, 0.104, 0, 0.0, 2.8),
    (0.46, 0.13, 0.088, 0, 0.004, 2.4), (0.49, 0.075, 0.064, 0, 0.004, 2),
]
# Slimmer than the hoodie: a T-shirt hangs closer to the body.
TEE = [
    (0.0, 0.17, 0.112, 0.008, 0.0, 2.6), (0.08, 0.162, 0.106, 0.004, 0.0, 2.6), (0.18, 0.158, 0.104, 0, -0.004, 2.6),
    (0.3, 0.172, 0.11, 0, -0.008, 2.6), (0.37, 0.18, 0.106, 0, -0.004, 2.8), (0.42, 0.168, 0.097, 0, 0.0, 2.8),
    (0.46, 0.12, 0.082, 0, 0.004, 2.4), (0.49, 0.068, 0.06, 0, 0.004, 2),
]


def grow(sections, d, dz=0.0):
    """The same loft sections, d bigger all round (and moved dz)."""
    return [(z + dz, a + d, b + d, ca, cb, n) for z, a, b, ca, cb, n in sections]


def neck(skin):
    return cyl(skin, 0.048, 0.1, loc=(0, 0.005, 0.52), verts=14)


def tops(m):
    """Torso pieces for each top. m: materials by name. Pattern UVs go on `top`."""
    out = {}
    top, dark, trim, skin, inner = m['top'], m['top_dark'], m['top_trim'], m['skin'], m['top_inner']

    # Hoodie: the original, with a hood, a kangaroo pocket and drawstrings.
    body = loft(top, HOODIE, cap0=False, name='hoodie')
    t = [body, loft(dark, [
        (-0.07, 0.186, 0.13, 0.015, -0.016, 2.6), (-0.06, 0.194, 0.14, 0.015, -0.016, 2.6),
        (-0.01, 0.192, 0.134, 0.012, -0.01, 2.6), (0.0, 0.18, 0.118, 0.01, 0, 2.6),
    ], name='hem')]
    t.append(loft(dark, [(0.43, 0.1, 0.075, 0, 0.03, 2.4), (0.5, 0.115, 0.085, 0, 0.035, 2.4), (0.545, 0.085, 0.07, 0, 0.045, 2.2)], name='hood'))
    t.append(sphere(top, 0.07, loc=(0, 0.075, 0.5), scale=(1.45, 0.75, 0.9), segs=16, rings=10))
    fy = surface_y(body, 0, 0.14)
    t.append(cube(dark, (0.2, 0.014, 0.12), loc=(0, fy - 0.003, 0.14), bevel=0.006))
    for sd in (1, -1):
        t.append(cyl(trim, 0.006, 0.12, loc=(sd * 0.03, surface_y(body, sd * 0.03, 0.41) - 0.006, 0.41), verts=6))
        t.append(sphere(trim, 0.009, loc=(sd * 0.03, surface_y(body, sd * 0.03, 0.35) - 0.006, 0.35), segs=8, rings=4))
    t.append(neck(skin))
    out['hoodie'] = (t, body, 0.27)

    # T-shirt: crew neck, a band at the hem.
    body = loft(top, TEE, cap0=False, name='tee')
    t = [body, loft(top, [(-0.04, 0.172, 0.114, 0.008, 0.0, 2.6), (0.0, 0.17, 0.112, 0.008, 0.0, 2.6)], cap1=False, name='hem')]
    t.append(tube(dark, [(0.075 * math.sin(a), 0.004 - 0.064 * math.cos(a), 0.488 - 0.012 * math.cos(a)) for a in [2 * math.pi * k / 24 for k in range(25)]],
                  [0.012] * 25, segs=8, cap0=False, cap1=False))
    t.append(neck(skin))
    out['tee'] = (t, body, 0.28)

    # Vest top: straps over bare shoulders, scooped at the neck.
    body = loft(top, grow(TEE, -0.004)[:5], cap0=False, cap1=False, name='vest')
    cut(body, lambda co: co.z > 0.33 and abs(co.x) < 0.1 - 0.25 * (co.z - 0.33))
    body = solidify(body, 0.006, 1)
    chest = loft(skin, [(0.3, 0.15, 0.098, 0, -0.008, 2.6), (0.37, 0.172, 0.098, 0, -0.004, 2.8), (0.42, 0.162, 0.092, 0, 0.0, 2.8),
                        (0.46, 0.115, 0.078, 0, 0.004, 2.4), (0.49, 0.066, 0.058, 0, 0.004, 2)], name='chest')
    t = [body, chest, loft(top, [(-0.04, 0.168, 0.11, 0.008, 0.0, 2.6), (0.0, 0.166, 0.108, 0.008, 0.0, 2.6)], cap1=False, name='hem'), neck(skin)]
    for sd in (1, -1):
        x = sd * 0.115
        yf, yb = surface_y(chest, x, 0.41), 0.1
        t.append(tube(top, [(x * 1.05, yf - 0.005, 0.36), (x, yf - 0.006, 0.42), (x * 0.95, -0.03, 0.465), (x * 0.95, 0.04, 0.462), (x, yb, 0.41), (x * 1.05, yb + 0.004, 0.36)],
                      [0.012] * 6, segs=8, squash=0.45))
    out['vest'] = (t, body, 0.22)

    # Sports jersey: V-neck with a trim, stripes round the sleeves (on the arms).
    body = loft(top, grow(TEE, 0.006), cap0=False, name='jersey')
    t = [body, loft(dark, [(-0.035, 0.18, 0.12, 0.008, 0.0, 2.6), (0.0, 0.178, 0.118, 0.008, 0.0, 2.6)], cap1=False, name='hem')]
    yv = surface_y(body, 0, 0.44)
    for sd in (1, -1):
        t.append(tube(dark, [(sd * 0.07, surface_y(body, sd * 0.07, 0.49) - 0.004, 0.49), (0, yv - 0.006, 0.415)], [0.011, 0.011], segs=8))
    t.append(neck(skin))
    out['jersey'] = (t, body, 0.27)

    # Rash vest: close fitting, a zip-up collar, panels down the sides.
    body = loft(top, grow(TEE, -0.006), cap0=False, name='rash')
    t = [body, loft(top, [(-0.03, 0.165, 0.106, 0.008, 0.0, 2.6), (0.0, 0.164, 0.106, 0.008, 0.0, 2.6)], cap1=False, name='hem')]
    t.append(loft(dark, [(0.46, 0.078, 0.07, 0, 0.004, 2), (0.53, 0.06, 0.056, 0, 0.004, 2)], cap0=False, cap1=False, name='collar'))
    for sd in (1, -1):
        t.append(loft(dark, [(z, 0.012, 0.06, sd * (w - 0.006), cb, 2) for z, w, _, _, cb, _ in grow(TEE, -0.006)[:5]], segs=10, name='panel'))
    t.append(cube(trim, (0.012, 0.006, 0.16), loc=(0, surface_y(body, 0, 0.42) - 0.002, 0.43), bevel=0.002))
    t.append(neck(skin))
    out['rash'] = (t, body, 0.26)

    # Denim jacket, open at the front over a T-shirt: collar, chest pockets and buttons.
    shirt = loft(inner, TEE, cap0=False, name='inner')
    jacket = loft(top, grow(HOODIE, 0.006, -0.04)[:1] + grow(HOODIE, 0.004)[1:-2], segs=32, cap0=False, cap1=False, name='jacket')
    cut(jacket, lambda co: co.y < -0.06 and abs(co.x) < 0.028 + 0.06 * max(0.0, co.z - 0.25) / 0.2)
    jacket = solidify(jacket, 0.008, 1)
    t = [shirt, jacket, neck(skin)]
    t.append(tube(dark, [(0.075 * math.sin(a), 0.004 - 0.064 * math.cos(a), 0.488 - 0.012 * math.cos(a)) for a in [2 * math.pi * k / 24 for k in range(25)]],
                  [0.011] * 25, segs=8, cap0=False, cap1=False))
    for sd in (1, -1):
        # Collar folded down over the shoulders.
        t.append(tube(dark, bezier((sd * 0.05, 0.07, 0.49), (sd * 0.13, 0.0, 0.47), (sd * 0.085, surface_y(jacket, sd * 0.085, 0.38) - 0.01, 0.37), 6),
                      [0.016] * 7, segs=8, squash=0.35))
        px = sd * 0.085
        py = surface_y(jacket, px, 0.31)
        t.append(cube(dark, (0.06, 0.008, 0.05), loc=(px, py - 0.003, 0.31), bevel=0.004))
        t.append(sphere(trim, 0.007, loc=(px, py - 0.008, 0.325), segs=8, rings=4))
        for z in (0.06, 0.15, 0.24):
            bx = sd * 0.036
            t.append(sphere(trim, 0.007, loc=(bx, surface_y(jacket, bx, z) - 0.004, z), segs=8, rings=4))
    t.append(loft(dark, [(-0.05, 0.19, 0.126, 0.012, 0, 2.6), (-0.02, 0.19, 0.126, 0.012, 0, 2.6)], name='band'))
    out['jacket'] = (t, jacket, 0.27)
    return out


def sleeves(m):
    """Upper arms and forearms (with hands) for each kind of sleeve, as {kind: (upper, fore)} per side."""
    top, dark, skin = m['top'], m['top_dark'], m['skin']
    out = {}

    def baggy(mat_, cuff, side):
        up = loft(mat_, [
            (0.05, 0.03, 0.03, 0, 0, 2), (0.035, 0.058, 0.056, 0, 0, 2), (0.0, 0.066, 0.062, 0, 0, 2),
            (-0.08, 0.062, 0.058, 0, 0, 2), (-0.2, 0.055, 0.052, 0, 0, 2), (-0.29, 0.052, 0.05, 0, 0, 2),
            (-0.32, 0.045, 0.045, 0, 0, 2), (-0.335, 0.02, 0.02, 0, 0, 2),
        ], segs=18, name='sleeve')
        fo = [loft(mat_, [
            (0.03, 0.02, 0.02, 0, 0, 2), (0.015, 0.048, 0.046, 0, 0, 2), (-0.02, 0.054, 0.05, 0, 0, 2),
            (-0.12, 0.05, 0.045, 0, 0, 2), (-0.2, 0.042, 0.039, 0, 0, 2),
        ], segs=18, cap1=False, name='sleeve'),
            loft(cuff, [(-0.19, 0.045, 0.042, 0, 0, 2), (-0.235, 0.038, 0.035, 0, 0, 2)], segs=18, name='cuff'),
            cyl(skin, 0.026, 0.05, loc=(0, 0, -0.245), verts=12), *hand(skin, side, wrist=-0.255)]
        return [up], fo

    def bare_upper(z0=0.05):
        return loft(skin, [
            (0.05, 0.03, 0.03, 0, 0, 2), (0.035, 0.05, 0.048, 0, 0, 2), (0.0, 0.052, 0.05, 0, 0, 2),
            (-0.1, 0.044, 0.042, 0, 0, 2), (-0.22, 0.038, 0.036, 0, 0, 2), (-0.3, 0.036, 0.035, 0, 0, 2), (-0.33, 0.02, 0.02, 0, 0, 2),
        ], segs=16, name='arm')

    def bare_fore(side):
        return [loft(skin, [(0.03, 0.02, 0.02, 0, 0, 2), (0.012, 0.036, 0.035, 0, 0, 2), (-0.08, 0.036, 0.034, 0, 0, 2),
                            (-0.2, 0.029, 0.027, 0, 0, 2), (-0.25, 0.025, 0.024, 0, 0, 2)], segs=16, name='fore'),
                *hand(skin, side, wrist=-0.255)]

    def tight(mat_, cuff, stripe, side):
        up = [loft(mat_, [
            (0.05, 0.03, 0.03, 0, 0, 2), (0.035, 0.055, 0.053, 0, 0, 2), (0.0, 0.058, 0.055, 0, 0, 2),
            (-0.1, 0.05, 0.048, 0, 0, 2), (-0.22, 0.044, 0.042, 0, 0, 2), (-0.3, 0.042, 0.041, 0, 0, 2), (-0.335, 0.02, 0.02, 0, 0, 2),
        ], segs=18, name='sleeve')]
        if stripe:
            up.append(loft(stripe, [(-0.12, 0.05, 0.048, 0, 0, 2), (-0.16, 0.048, 0.046, 0, 0, 2)], segs=18, name='stripe'))
        fo = [loft(mat_, [(0.03, 0.02, 0.02, 0, 0, 2), (0.012, 0.043, 0.042, 0, 0, 2), (-0.08, 0.042, 0.04, 0, 0, 2),
                          (-0.2, 0.034, 0.032, 0, 0, 2)], segs=18, cap1=False, name='sleeve'),
              loft(cuff, [(-0.195, 0.036, 0.034, 0, 0, 2), (-0.23, 0.032, 0.03, 0, 0, 2)], segs=16, name='cuff'),
              cyl(skin, 0.025, 0.04, loc=(0, 0, -0.24), verts=12), *hand(skin, side, wrist=-0.255)]
        return up, fo

    for sd, side in (('L', 1), ('R', -1)):
        out.setdefault('hoodie', {})[sd] = baggy(top, dark, side)
        out.setdefault('jacket', {})[sd] = baggy(top, dark, side)
        # Short sleeve over a bare arm.
        sl = loft(top, [
            (0.05, 0.034, 0.034, 0, 0, 2), (0.035, 0.06, 0.058, 0, 0, 2), (0.0, 0.066, 0.063, 0, 0, 2),
            (-0.1, 0.062, 0.058, 0, 0, 2), (-0.13, 0.06, 0.056, 0, 0, 2),
        ], segs=18, cap1=False, name='sleeve')
        hem = loft(dark, [(-0.125, 0.062, 0.058, 0, 0, 2), (-0.145, 0.06, 0.056, 0, 0, 2)], segs=18, name='band')
        out.setdefault('tee', {})[sd] = ([sl, hem, bare_upper()], bare_fore(side))
        out.setdefault('bare', {})[sd] = ([bare_upper()], bare_fore(side))
        out.setdefault('jersey', {})[sd] = tight(top, dark, dark, side)
        out.setdefault('rash', {})[sd] = tight(top, dark, None, side)
    return out


# ---------------------------------------------------------------- bottoms

def bottoms(m):
    """Pelvis, thighs and shins for each kind of bottoms, {kind: {'pelvis': [...], 'thigh': [...], 'shin': [...]}}."""
    b, dark, skin, sock, trim, legs = m['bottom'], m['bottom_dark'], m['skin'], m['sock'], m['bottom_trim'], m['legs']
    out = {}

    def hips(mat_, d=0.0):
        return loft(mat_, grow([
            (0.07, 0.13, 0.075, 0.02, 0.0, 2.6), (0.02, 0.155, 0.09, 0.02, 0.0, 2.6), (-0.03, 0.155, 0.092, 0.02, 0.0, 2.4),
            (-0.075, 0.12, 0.085, 0.02, 0.0, 2.2), (-0.105, 0.05, 0.06, 0.02, 0.0, 2),
        ], d), name='hips')

    def thigh(mat_, d=0.0, to=-0.5):
        secs = [(0.06, 0.04, 0.04, 0, 0.02, 2), (0.04, 0.068, 0.066, 0, 0.022, 2), (0.0, 0.076, 0.072, 0, 0.018, 2),
                (-0.15, 0.08, 0.08, 0, -0.002, 2), (-0.32, 0.072, 0.072, 0, -0.004, 2), (-0.44, 0.066, 0.068, 0, -0.008, 2),
                (-0.48, 0.05, 0.05, 0, -0.008, 2), (-0.5, 0.02, 0.02, 0, -0.006, 2)]
        return loft(mat_, [(z, a + d, bb + d, ca, cb, n) for z, a, bb, ca, cb, n in secs], segs=20, name='thigh')

    def shin(mat_, d=0.0, hem=None, hem_d=0.0):
        bits = [sphere(mat_, 0.068 + d, loc=(0, -0.008, 0), segs=20, rings=12),
                loft(mat_, [(z, a + d, bb + d, ca, cb, n) for z, a, bb, ca, cb, n in [
                    (0.0, 0.068, 0.068, 0, -0.006, 2), (-0.12, 0.064, 0.062, 0, 0, 2), (-0.3, 0.068, 0.066, 0, 0, 2),
                    (-0.4, 0.074, 0.074, 0, -0.008, 2), (-0.43, 0.078, 0.082, 0, -0.016, 2)]], segs=20, cap0=False, name='shin')]
        if hem:
            bits.append(loft(hem, [(-0.405, 0.08 + hem_d, 0.08 + hem_d, 0, -0.01, 2), (-0.44, 0.082 + hem_d, 0.086 + hem_d, 0, -0.018, 2)], segs=20, name='hem'))
        return bits

    def bare_shin(sock_top=-0.32):
        return [sphere(skin, 0.05, loc=(0, -0.006, 0), segs=18, rings=10),
                loft(skin, [(0.0, 0.05, 0.05, 0, -0.004, 2), (-0.1, 0.05, 0.052, 0, 0.004, 2), (-0.22, 0.042, 0.042, 0, 0, 2),
                            (sock_top + 0.01, 0.036, 0.036, 0, 0, 2)], segs=18, cap0=False, cap1=False, name='calf'),
                loft(sock, [(sock_top + 0.012, 0.037, 0.037, 0, 0, 2), (sock_top - 0.01, 0.042, 0.042, 0, 0, 2),
                            (-0.43, 0.043, 0.046, 0, -0.008, 2), (-0.45, 0.03, 0.03, 0, -0.008, 2)], segs=18, name='sock')]

    out['jeans'] = {'pelvis': [hips(b)], 'thigh': [thigh(b)], 'shin': shin(b, hem=dark)}

    # Shorts to just above the knee, bare legs and socks.
    short_leg = loft(b, [(0.06, 0.045, 0.045, 0, 0.02, 2), (0.04, 0.074, 0.072, 0, 0.022, 2), (0.0, 0.084, 0.08, 0, 0.018, 2),
                         (-0.15, 0.09, 0.09, 0, 0.0, 2), (-0.27, 0.09, 0.09, 0, -0.004, 2)], segs=20, cap1=False, name='shorts')
    short_leg = solidify(short_leg, 0.008, 1)
    knee = loft(skin, [(-0.2, 0.06, 0.06, 0, 0.0, 2), (-0.32, 0.056, 0.058, 0, -0.004, 2), (-0.44, 0.052, 0.054, 0, -0.008, 2),
                       (-0.48, 0.04, 0.04, 0, -0.008, 2), (-0.5, 0.02, 0.02, 0, -0.006, 2)], segs=18, name='leg')
    out['shorts'] = {'pelvis': [hips(b)], 'thigh': [short_leg, knee], 'shin': bare_shin()}

    # Joggers: roomy, a stripe down the side, gathered in cuffs at the ankle.
    stripe = lambda z0, z1, w: loft(trim, [(z, 0.012, 0.03, w(z), 0.0, 2) for z in (z0, (z0 + z1) / 2, z1)], segs=10, name='stripe')
    out['joggers'] = {
        'pelvis': [hips(b, 0.005)],
        'thigh': [thigh(b, 0.01), stripe(0.0, -0.44, lambda z: 0.082 if z > -0.2 else 0.076)],
        'shin': [sphere(b, 0.074, loc=(0, -0.008, 0), segs=20, rings=12),
                 loft(b, [(0.0, 0.074, 0.074, 0, -0.006, 2), (-0.15, 0.07, 0.068, 0, 0, 2), (-0.32, 0.064, 0.062, 0, 0, 2),
                          (-0.38, 0.056, 0.056, 0, 0, 2)], segs=20, cap0=False, name='shin'),
                 loft(dark, [(-0.37, 0.058, 0.058, 0, 0, 2), (-0.44, 0.058, 0.06, 0, -0.008, 2)], segs=20, name='cuff'),
                 stripe(-0.02, -0.36, lambda z: 0.072 if z > -0.2 else 0.064)],
    }

    # Leggings: close fitting all the way down.
    out['leggings'] = {'pelvis': [hips(b, -0.004)], 'thigh': [thigh(b, -0.012)],
                       'shin': [sphere(b, 0.056, loc=(0, -0.008, 0), segs=20, rings=12),
                                loft(b, [(0.0, 0.056, 0.056, 0, -0.006, 2), (-0.12, 0.058, 0.058, 0, 0.002, 2), (-0.28, 0.048, 0.048, 0, 0, 2),
                                         (-0.43, 0.044, 0.046, 0, -0.008, 2), (-0.45, 0.03, 0.03, 0, -0.008, 2)], segs=20, cap0=False, name='shin')]}

    # Skater skirt over leggings: each half flares from the hip and swings with its thigh.
    def skirt_half():
        k = loft(b, [(0.07, 0.1, 0.1, 0, 0.0, 2), (0.0, 0.12, 0.118, 0, 0.0, 2), (-0.1, 0.14, 0.135, 0, 0.0, 2),
                     (-0.16, 0.152, 0.146, 0, 0.0, 2)], segs=28, cap0=False, cap1=False, name='skirt')
        return solidify(k, 0.008, 1)
    out['skirt'] = {
        'pelvis': [hips(legs, -0.004), loft(b, [(0.075, 0.14, 0.085, 0.02, 0.0, 2.6), (0.0, 0.17, 0.104, 0.02, 0.0, 2.4),
                                                  (-0.06, 0.19, 0.12, 0.02, 0.0, 2.2)], cap1=False, name='skirt_top')],
        'thigh': [thigh(legs, -0.012), skirt_half()],
        'shin': [sphere(legs, 0.056, loc=(0, -0.008, 0), segs=20, rings=12),
                 loft(legs, [(0.0, 0.056, 0.056, 0, -0.006, 2), (-0.12, 0.058, 0.058, 0, 0.002, 2), (-0.28, 0.048, 0.048, 0, 0, 2),
                             (-0.43, 0.044, 0.046, 0, -0.008, 2), (-0.45, 0.03, 0.03, 0, -0.008, 2)], segs=20, cap0=False, name='shin')],
    }
    return out


def shoes(m):
    """Low skate shoes (the original) and high tops."""
    upper, sole_m, stripe, lace = m['shoe'], m['sole'], m['shoe_accent'], m['sole_tread']
    laces = m['lace']
    out = {}
    from build_assets import shoe as low_shoe
    out['low'] = low_shoe(upper, sole_m, stripe, lace)

    st = -0.055
    plan = [
        (0.095, 0.042, 0.13), (0.085, 0.054, 0.14), (0.05, 0.06, 0.145), (0.0, 0.062, 0.13),
        (-0.06, 0.062, 0.08), (-0.12, 0.062, 0.05), (-0.165, 0.056, 0.038), (-0.19, 0.044, 0.03),
        (-0.203, 0.026, 0.021), (-0.207, 0.01, 0.014),
    ]
    up = loft(upper, [(y, w, h / 2, 0, st + h / 2, 3.2) for y, w, h in plan], axis='y', name='upper')
    sole = loft(sole_m, [(y + (0.006 if y > 0 else -0.006 if y < -0.15 else 0), w + 0.006, 0.013, 0, st - 0.009, 6)
                         for y, w, _ in plan], axis='y', name='sole')
    tread = loft(lace, [(y, w + 0.004, 0.004, 0, -0.073, 6) for y, w, _ in plan[1:-1]], axis='y', name='tread')
    bits = [up, sole, tread]
    # A star on the ankle each side, a toe cap and laces up the front.
    for sd in (1, -1):
        bits.append(cyl(stripe, 0.026, 0.006, loc=(sd * 0.063, 0.03, st + 0.075), rot=(0, math.pi / 2, 0), verts=5))
    bits.append(loft(sole_m, [(y, w + 0.003, h / 2 + 0.002, 0, st + h / 2, 3.2) for y, w, h in plan[-4:]], axis='y', name='toecap'))
    for i in range(5):
        y = -0.1 + i * 0.03
        z = st + (0.06 if y < -0.06 else 0.06 + (y + 0.06) * 1.1) + 0.012
        bits.append(cube(laces, (0.05, 0.008, 0.008), loc=(0, y, z), rot=(-0.6 if y > -0.06 else -0.3, 0, 0), bevel=0.003))
    bits.append(cyl(upper, 0.056, 0.024, loc=(0, 0.035, st + 0.142), verts=16, bevel=0.008))
    out['high'] = bits
    return out


# ---------------------------------------------------------------- build

def build_heads(parts):
    skin = mat('skin', (240, 192, 154))
    eye = mat('eye', (30, 30, 34))
    white = mat('eye_white', (255, 255, 255))
    hair = mat('hair', (92, 58, 36))
    tips = mat('hair_tips', (92, 58, 36))
    brow = mat('brow', (92, 58, 36))
    mouth = mat('mouth', (150, 70, 60))
    teeth = mat('teeth', (255, 255, 250))
    tongue = mat('tongue', (232, 96, 112))
    tie = mat('hair_tie', (232, 64, 120))
    freckle = mat('freckle', (190, 120, 80))
    blush = mat('blush', (246, 140, 140))
    lash = mat('lash', (30, 30, 34))
    frame = mat('glasses', (40, 40, 44))
    lens = mat('lens', (40, 44, 60))
    hat = mat('hat', (232, 64, 42))
    hat_dark = mat('hat_dark', (200, 44, 30))
    hat_trim = mat('hat_trim', (250, 246, 236))
    horn = mat('horn', (255, 206, 64))

    sk, base = head_base(skin, eye, white, brow)
    parts.append(head_piece('head__base', base))
    for name, bits in mouths(sk, mouth, teeth, tongue).items():
        parts.append(head_piece(f'mouth__{name}', bits))
    for name, bits in face_extras(sk, freckle, blush, lash).items():
        parts.append(head_piece(f'face__{name}', bits))
    for name, bits in glasses(sk, frame, lens).items():
        parts.append(head_piece(f'glasses__{name}', bits))
    for name, (under, full) in hair_styles(hair, tie, tips).items():
        under = [dup(o) if o in full else o for o in under]
        parts.append(head_piece(f'hair__{name}__under', under))
        parts.append(head_piece(f'hair__{name}', full))
    for name, bits in hats(hat, hat_dark, hat_trim, horn).items():
        parts.append(head_piece(f'hat__{name}', bits))
    # The helmets each ride puts on you, recoloured at runtime by their own material names.
    parts.append(head_piece('helmet__skate', skate_helmet_parts()))
    parts.append(head_piece('helmet__farm', helmet_parts()))
    parts.append(head_piece('helmet__snow', beanie_parts()))
    parts.append(head_piece('helmet__fullface', fullface_parts(res=(64, 44))))


def export_parts(path, parts):
    # Anything left over (pieces only used as sources for duplicates) isn't exported.
    keep = set(parts)
    for o in list(bpy.context.scene.objects):
        if o not in keep:
            bpy.data.objects.remove(o, do_unlink=True)
    bpy.ops.object.select_all(action='DESELECT')
    for o in parts:
        o.select_set(True)
    bpy.ops.export_scene.gltf(
        filepath=path, export_format='GLB', use_selection=True,
        export_apply=True, export_yup=True, export_materials='EXPORT', export_texcoords=True,
    )
    print('wrote', path, os.path.getsize(path), 'bytes')


def build_body(parts):
    m = {n: mat(n, c) for n, c in (
        ('skin', (240, 192, 154)), ('top', (47, 143, 216)), ('top_dark', (30, 104, 166)), ('top_trim', (240, 240, 235)),
        ('top_inner', (245, 245, 240)), ('bottom', (52, 62, 82)), ('bottom_dark', (38, 45, 60)), ('bottom_trim', (240, 240, 235)),
        ('legs', (40, 40, 48)), ('sock', (245, 245, 240)), ('shoe', (245, 245, 240)), ('sole', (236, 230, 214)),
        ('sole_tread', (60, 50, 45)), ('shoe_accent', (232, 64, 42)), ('lace', (250, 250, 250)),
    )}
    for name, (bits, body, chest_z) in tops(m).items():
        o = join(f'torso__{name}', bits)
        uv_wrap(o, {'top'}, around=8)
        parts.append(o)
    for name, by_side in sleeves(m).items():
        for sd, (up, fo) in by_side.items():
            u = join(f'upperArm_{sd}__{name}', up)
            f = join(f'forearm_{sd}__{name}', fo)
            for o in (u, f):
                uv_wrap(o, {'top'}, around=3)
            parts += [u, f]
    for name, pieces in bottoms(m).items():
        parts.append(join(f'pelvis__{name}', pieces['pelvis']))
        th, sh = pieces['thigh'], pieces['shin']
        for sd in ('L', 'R'):
            parts.append(join(f'thigh_{sd}__{name}', [dup(o) for o in th] if sd == 'L' else th))
            parts.append(join(f'shin_{sd}__{name}', [dup(o) for o in sh] if sd == 'L' else sh))
    for name, bits in shoes(m).items():
        parts.append(join(f'shoe_L__{name}', [dup(o) for o in bits]))
        parts.append(join(f'shoe_R__{name}', bits))


def build_boards(parts):
    """The skateboard again, with the whole underside printable (UVs nose to tail)."""
    d = build_board()
    me = d.data
    graphic = next(i for i, m in enumerate(me.materials) if m.name == 'deck_graphic')
    for p in me.polygons:
        # The deck's underside, not the bottoms of the trucks joined to it.
        if p.normal.z < -0.5 and p.center.z > 0.088:
            p.material_index = graphic
    uv_plane(d, {'deck_graphic'}, (0.8, 0.21), axes='xy')
    d.name = 'deck__std'
    parts.append(d)


def build_wardrobe():
    reset()
    parts = []
    build_heads(parts)
    build_body(parts)
    build_boards(parts)
    for o in parts:
        o.location = (0, 0, 0)
    export_parts(os.path.join(OUT, 'wardrobe.glb'), parts)


if __name__ == '__main__':
    build_wardrobe()
