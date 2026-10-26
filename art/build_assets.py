"""Builds the game's models in headless Blender and exports them as glTF.

Run with:  python art/build_assets.py [skater] [props]   (needs the `bpy` package)

Conventions (Blender is Z-up, three.js Y-up; the glTF exporter converts):
  * Blender -Y becomes three.js +Z, the direction the skater faces (towards the camera).
  * Every skater part has its origin at its joint and hangs down -Z, matching src/skater.ts.
  * Props have their origin at ground level.
"""
import math
import os
import bpy
import bmesh
from mathutils import Vector, Matrix

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'public', 'models')
os.makedirs(OUT, exist_ok=True)

MATS = {}


def mat(name, rgb):
    if name in MATS:
        return MATS[name]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes['Principled BSDF']
    bsdf.inputs['Base Color'].default_value = (*srgb_to_linear(rgb), 1)
    bsdf.inputs['Roughness'].default_value = 0.8
    MATS[name] = m
    return m


def srgb_to_linear(rgb):
    def f(c):
        c = c / 255
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    return tuple(f(c) for c in rgb)


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    MATS.clear()


def finish(obj, material, smooth=True, subdiv=0):
    obj.data.materials.clear()
    obj.data.materials.append(material)
    if subdiv:
        mod = obj.modifiers.new('sub', 'SUBSURF')
        mod.levels = subdiv
        mod.render_levels = subdiv
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.modifier_apply(modifier='sub')
    if smooth:
        for p in obj.data.polygons:
            p.use_smooth = True
    else:
        for p in obj.data.polygons:
            p.use_smooth = False
    return obj


def apply_tf(obj):
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)


def cube(material, size, loc=(0, 0, 0), rot=(0, 0, 0), bevel=0.0, subdiv=0, smooth=True, segs=2):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot)
    o = bpy.context.object
    o.scale = size
    apply_tf(o)
    if bevel:
        m = o.modifiers.new('bev', 'BEVEL')
        m.width = bevel
        m.segments = segs
        bpy.context.view_layer.objects.active = o
        bpy.ops.object.modifier_apply(modifier='bev')
    return finish(o, material, smooth, subdiv)


def sphere(material, r, loc=(0, 0, 0), scale=(1, 1, 1), segs=20, rings=12, smooth=True):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, location=loc, segments=segs, ring_count=rings)
    o = bpy.context.object
    o.scale = scale
    apply_tf(o)
    return finish(o, material, smooth)


def ico(material, r, loc=(0, 0, 0), scale=(1, 1, 1), sub=1, smooth=False, jitter=0.0, seed=0):
    bpy.ops.mesh.primitive_ico_sphere_add(radius=r, location=(0, 0, 0), subdivisions=sub)
    o = bpy.context.object
    if jitter:
        import random
        rnd = random.Random(seed)
        for v in o.data.vertices:
            v.co *= 1 + (rnd.random() - 0.5) * jitter
    o.scale = scale
    o.location = loc
    apply_tf(o)
    return finish(o, material, smooth)


def cyl(material, r, depth, loc=(0, 0, 0), rot=(0, 0, 0), verts=16, r2=None, smooth=True, bevel=0.0):
    if r2 is None:
        bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=depth, location=loc, rotation=rot, vertices=verts)
    else:
        bpy.ops.mesh.primitive_cone_add(radius1=r, radius2=r2, depth=depth, location=loc, rotation=rot, vertices=verts)
    o = bpy.context.object
    if bevel:
        m = o.modifiers.new('bev', 'BEVEL')
        m.width = bevel
        m.segments = 2
        bpy.context.view_layer.objects.active = o
        bpy.ops.object.modifier_apply(modifier='bev')
    o = finish(o, material, smooth)
    if smooth:
        # Keep cylinder caps crisp.
        m = o.modifiers.new('ws', 'WEIGHTED_NORMAL') if hasattr(o.modifiers, 'new') else None
    return o


def capsule(material, r_top, r_bot, length, loc=(0, 0, 0), scale=(1, 1, 1), segs=16):
    """Tapered capsule from loc down to loc - length on Z."""
    bm = bmesh.new()
    rings = 10
    profile = []
    # top hemisphere
    for i in range(rings // 2 + 1):
        a = (math.pi / 2) * (1 - i / (rings // 2))
        profile.append((r_top * math.cos(a), -r_top + r_top * math.sin(a) * 1.0 + 0))
    # shift: top cap centre at -r_top
    profile = [(x, z) for x, z in profile]
    body_top = -r_top
    body_bot = -(length - r_bot)
    prof = []
    for i in range(rings // 2 + 1):
        a = (math.pi / 2) * (i / (rings // 2))
        prof.append((r_top * math.sin(a), body_top + r_top * math.cos(a)))
    for i in range(rings // 2 + 1):
        a = (math.pi / 2) * (i / (rings // 2))
        prof.append((r_bot * math.cos(a), body_bot - r_bot * math.sin(a)))
    ringsv = []
    for (pr, pz) in prof:
        ring = []
        for s in range(segs):
            t = 2 * math.pi * s / segs
            ring.append(bm.verts.new((pr * math.cos(t), pr * math.sin(t), pz)))
        ringsv.append(ring)
    for a, b in zip(ringsv, ringsv[1:]):
        for s in range(segs):
            bm.faces.new((a[s], a[(s + 1) % segs], b[(s + 1) % segs], b[s]))
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    me = bpy.data.meshes.new('cap')
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new('cap', me)
    bpy.context.collection.objects.link(o)
    o.scale = scale
    o.location = loc
    apply_tf(o)
    bpy.context.view_layer.objects.active = o
    o.select_set(True)
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.mesh.normals_make_consistent(inside=False)
    bpy.ops.object.mode_set(mode='OBJECT')
    return finish(o, material, True)


def join(name, objs):
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    if len(objs) > 1:
        bpy.ops.object.join()
    o = bpy.context.object
    o.name = name
    o.data.name = name
    return o


def export(path, objects=None):
    bpy.ops.object.select_all(action='DESELECT')
    for o in (objects or bpy.context.scene.objects):
        o.select_set(True)
    bpy.ops.export_scene.gltf(
        filepath=path, export_format='GLB', use_selection=True,
        export_apply=True, export_yup=True, export_materials='EXPORT',
    )
    print('wrote', path, os.path.getsize(path), 'bytes')


# ---------------------------------------------------------------- skater

def hair_shell(material):
    """Short hair showing below the back and sides of the cap."""
    o = sphere(material, 0.129, loc=(0, 0, 0.16), scale=(0.97, 1.03, 1.07), segs=24, rings=16)
    bm = bmesh.new()
    bm.from_mesh(o.data)
    cap_line = lambda y: 0.16 + 0.05 - 0.035 * max(0.0, y) / 0.137 + 0.012  # tucked just under the cap rim
    kill = [v for v in bm.verts
            if v.co.y < -0.02 - 0.03 * max(0.0, (v.co.z - 0.12) / 0.08)  # sideburns taper forward at the top
            or v.co.z < 0.085 - 0.03 * max(0.0, v.co.y) / 0.13
            or v.co.z > cap_line(v.co.y)]
    bmesh.ops.delete(bm, geom=kill, context='VERTS')
    bm.to_mesh(o.data)
    bm.free()
    sol = o.modifiers.new('sol', 'SOLIDIFY')
    sol.thickness = 0.006
    bpy.context.view_layer.objects.active = o
    bpy.ops.object.modifier_apply(modifier='sol')
    return o


def cap_parts(material):
    """Baseball cap: crown, sweatband rim and a curved peak joined to the front of the rim."""
    R = 0.137          # crown radius, just over the skull (0.125)
    cz = 0.16          # skull centre height
    rim = 0.05         # rim height above the skull centre at the front
    back_drop = 0.035  # the back of the cap sits lower
    segs = 32

    def drop(y):
        return back_drop * max(0.0, y) / R

    # Crown: revolve a profile from the rim up to the top.
    bm = bmesh.new()
    a0 = math.asin(rim / R)
    rings = []
    n_lat = 8
    for i in range(n_lat + 1):
        a = a0 + (math.pi / 2 - a0) * i / n_lat
        r = R * math.cos(a)
        z = cz + R * math.sin(a)
        ring = []
        for k in range(segs):
            t = 2 * math.pi * k / segs
            x, y = r * math.sin(t), -r * math.cos(t)
            y *= 1.04
            ring.append(bm.verts.new((x, y, z - drop(y) * (1 - i / n_lat))))
        rings.append(ring)
    for ra, rb in zip(rings, rings[1:]):
        for k in range(segs):
            bm.faces.new((ra[k], ra[(k + 1) % segs], rb[(k + 1) % segs], rb[k]))
    top = bm.verts.new((0, 0, cz + R))
    for k in range(segs):
        bm.faces.new((rings[-1][k], rings[-1][(k + 1) % segs], top))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new('crown')
    bm.to_mesh(me)
    bm.free()
    crown = bpy.data.objects.new('crown', me)
    bpy.context.collection.objects.link(crown)
    crown = finish(crown, material, True)
    sol = crown.modifiers.new('sol', 'SOLIDIFY')
    sol.thickness = 0.008
    bpy.context.view_layer.objects.active = crown
    bpy.ops.object.modifier_apply(modifier='sol')

    # Rim band: a short ring following the bottom edge, closing the crown.
    r0 = R * math.cos(a0)
    bm = bmesh.new()
    lo, hi = [], []
    for k in range(segs):
        t = 2 * math.pi * k / segs
        x, y = (r0 + 0.004) * math.sin(t), -(r0 + 0.004) * math.cos(t) * 1.04
        z = cz + rim - drop(y)
        lo.append(bm.verts.new((x, y, z - 0.004)))
        hi.append(bm.verts.new((x, y, z + 0.018)))
    for k in range(segs):
        bm.faces.new((lo[k], lo[(k + 1) % segs], hi[(k + 1) % segs], hi[k]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new('band')
    bm.to_mesh(me)
    bm.free()
    band = bpy.data.objects.new('band', me)
    bpy.context.collection.objects.link(band)
    band = finish(band, material, True)
    sol = band.modifiers.new('sol', 'SOLIDIFY')
    sol.thickness = 0.006
    bpy.context.view_layer.objects.active = band
    bpy.ops.object.modifier_apply(modifier='sol')

    # Peak: inner edge on the front of the rim, outer edge a D-shaped curve, tipped down a little.
    bm = bmesh.new()
    inner, outer = [], []
    n = 16
    span = math.radians(75)
    for i in range(n + 1):
        t = -span + 2 * span * i / n
        ix, iy = r0 * math.sin(t), -r0 * math.cos(t) * 1.04
        reach = 0.09 * math.cos(t * 1.05) + 0.01
        ox, oy = ix * 1.08, iy - reach
        z_in = cz + rim - 0.002
        z_out = z_in - 0.014 * (reach / 0.1)
        # Slight downward curve across the width.
        z_out -= 0.012 * (math.sin(t) ** 2)
        inner.append(bm.verts.new((ix, iy, z_in)))
        outer.append(bm.verts.new((ox, oy, z_out)))
    for i in range(n):
        bm.faces.new((inner[i], inner[i + 1], outer[i + 1], outer[i]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new('peak')
    bm.to_mesh(me)
    bm.free()
    peak = bpy.data.objects.new('peak', me)
    bpy.context.collection.objects.link(peak)
    peak = finish(peak, material, True)
    sol = peak.modifiers.new('sol', 'SOLIDIFY')
    sol.thickness = 0.012
    sol.offset = 0
    bpy.context.view_layer.objects.active = peak
    bpy.ops.object.modifier_apply(modifier='sol')

    button = sphere(material, 0.014, loc=(0, 0, cz + R + 0.004), segs=10, rings=6)
    return [crown, band, peak, button]


def loft(material, sections, segs=24, axis='z', cap0=True, cap1=True, name='loft'):
    """Skin a run of rounded cross-sections into one closed mesh.

    Each section is (pos, ra, rb, ca, cb, n): its position along `axis`, half sizes and
    centre on the two other axes (x, y for a z loft; x, z for a y loft), and a
    superellipse exponent (2 = ellipse, higher = boxier).
    """
    bm = bmesh.new()
    rings = []
    for pos, ra, rb, ca, cb, n in sections:
        ring = []
        for k in range(segs):
            t = 2 * math.pi * k / segs
            c, s = math.cos(t), math.sin(t)
            a = ca + ra * math.copysign(abs(s) ** (2 / n), s)
            b = cb - rb * math.copysign(abs(c) ** (2 / n), c)
            ring.append(bm.verts.new((a, b, pos) if axis == 'z' else (a, pos, b)))
        rings.append(ring)
    for ra, rb in zip(rings, rings[1:]):
        for k in range(segs):
            bm.faces.new((ra[k], ra[(k + 1) % segs], rb[(k + 1) % segs], rb[k]))
    for ring, (pos, _, _, ca, cb, _), on in ((rings[0], sections[0], cap0), (rings[-1], sections[-1], cap1)):
        if on:
            mid = bm.verts.new((ca, cb, pos) if axis == 'z' else (ca, pos, cb))
            for k in range(segs):
                bm.faces.new((ring[k], ring[(k + 1) % segs], mid))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(o)
    return finish(o, material, True)


def surface_y(obj, x, z):
    """Front surface (-Y) of a mesh at (x, z), found by casting a ray backwards."""
    bpy.context.view_layer.update()
    hit, loc, _, _ = obj.ray_cast(Vector((x, -1, z)), Vector((0, 1, 0)))
    return loc.y if hit else 0.0


def skull(material):
    """Head with a narrower jaw and a little chin, same crown as the plain sphere the cap fits."""
    o = sphere(material, 0.125, loc=(0, 0, 0.16), scale=(0.95, 1, 1.05), segs=32, rings=20)
    for v in o.data.vertices:
        below = max(0.0, 0.15 - v.co.z) / 0.13
        v.co.x *= 1 - 0.22 * below
        if v.co.y < 0:
            v.co.y -= 0.02 * below * (1 - abs(v.co.x) / 0.12)
        else:
            v.co.y *= 1 - 0.25 * below
    return o


def face(head, skin, eye, white, hair, mouth):
    """Eyes, brows, nose and mouth placed on the skull's surface."""
    out = []
    for s in (1, -1):
        x = s * 0.043
        y = surface_y(head, x, 0.152)
        out.append(sphere(eye, 0.02, loc=(x, y + 0.006, 0.152), scale=(0.85, 0.5, 1.25), segs=12, rings=8))
        out.append(sphere(white, 0.0055, loc=(x - 0.006, y - 0.004, 0.164), segs=8, rings=4))
        yb = surface_y(head, s * 0.047, 0.186)
        brow = cube(hair, (0.04, 0.014, 0.011), loc=(s * 0.047, yb - 0.001, 0.186), rot=(0, s * 0.15, 0), bevel=0.005)
        out.append(brow)
    yn = surface_y(head, 0, 0.135)
    out.append(sphere(skin, 0.02, loc=(0, yn - 0.006, 0.133), scale=(0.8, 0.9, 1.0), segs=12, rings=8))
    # Mouth: a short smile, a curved row of small beads.
    beads = []
    for i in range(13):
        u = (i - 6) / 6
        x, z = u * 0.026, 0.092 + 0.008 * u * u
        beads.append(sphere(mouth, 0.0052, loc=(x, surface_y(head, x, z) + 0.002, z), scale=(1.2, 0.7, 1), segs=8, rings=4))
    out.append(join('mouth', beads))
    for s in (1, -1):
        out.append(sphere(skin, 0.03, loc=(s * 0.118, 0.005, 0.15), scale=(0.45, 0.9, 1.15), segs=12, rings=8))
    return out


def hand(skin, side, wrist):
    """Relaxed hand hanging from the wrist: palm, four curled fingers and a thumb."""
    inward = -side  # towards the body's centre line
    bits = [cube(skin, (0.04, 0.075, 0.075), loc=(0, 0, wrist - 0.04), bevel=0.016, segs=3)]
    for i, y in enumerate((-0.027, -0.009, 0.009, 0.027)):
        ln = (0.05, 0.056, 0.053, 0.044)[i]
        f = capsule(skin, 0.0105, 0.0095, ln, loc=(0, 0, 0), segs=10)
        f.rotation_euler = (0, inward * 0.45, 0)
        f.location = (inward * 0.004, y, wrist - 0.068)
        apply_tf(f)
        bits.append(f)
    th = capsule(skin, 0.013, 0.011, 0.05, segs=10)
    th.rotation_euler = (0.6, inward * 0.3, 0)
    th.location = (inward * 0.006, -0.03, wrist - 0.02)
    apply_tf(th)
    bits.append(th)
    return bits


def shoe(upper, sole_m, stripe, lace):
    """Skate shoe: ankle at the origin, toes towards -Y, sole bottom at -0.075."""
    st = -0.055  # top of the sole
    plan = [  # y, half width, upper height
        (0.095, 0.035, 0.05), (0.085, 0.05, 0.072), (0.05, 0.058, 0.082), (0.0, 0.06, 0.078),
        (-0.06, 0.062, 0.06), (-0.12, 0.062, 0.045), (-0.165, 0.056, 0.036), (-0.19, 0.044, 0.028),
        (-0.203, 0.026, 0.02), (-0.207, 0.01, 0.014),
    ]
    up = loft(upper, [(y, w, h / 2, 0, st + h / 2, 3.2) for y, w, h in plan], axis='y', name='upper')
    sole = loft(sole_m, [(y + (0.006 if y > 0 else -0.006 if y < -0.15 else 0), w + 0.006, 0.011, 0, st - 0.009, 6)
                         for y, w, _ in plan], axis='y', name='sole')
    tread = loft(lace, [(y, w + 0.004, 0.004, 0, -0.073, 6) for y, w, _ in plan[1:-1]], axis='y', name='tread')
    bits = [up, sole, tread]
    # Side stripe swooping from the heel up towards the laces.
    width = lambda y: next(pw for py, pw, _ in plan if py <= y)
    for s in (1, -1):
        bits.append(loft(stripe, [
            (y, 0.004, 0.009 - 0.004 * u, s * (width(y) + 0.0015), -0.036 + 0.03 * u * u ** 0.5, 2)
            for u, y in ((i / 6, 0.075 - 0.14 * i / 6) for i in range(7))
        ], segs=10, axis='y', name='stripe'))
    # Laces and tongue.
    bits.append(cube(lace, (0.05, 0.075, 0.012), loc=(0, -0.05, st + 0.056), rot=(-0.38, 0, 0), bevel=0.005))
    for i in range(3):
        y = -0.03 - i * 0.025
        bits.append(cube(upper, (0.056, 0.008, 0.008), loc=(0, y, st + 0.068 - i * 0.01), bevel=0.003))
    # Padded collar round the ankle.
    bits.append(cyl(upper, 0.05, 0.022, loc=(0, 0.04, st + 0.075), verts=16, bevel=0.008))
    return bits


def build_skater():
    reset()
    skin = mat('skin', (240, 192, 154))
    shirt = mat('shirt', (47, 143, 216))
    shirt_dk = mat('shirt_dark', (30, 104, 166))
    string = mat('drawstring', (240, 240, 235))
    pants = mat('pants', (52, 62, 82))
    pants_dk = mat('pants_dark', (38, 45, 60))
    shoe_m = mat('shoe', (245, 245, 240))
    sole = mat('sole', (236, 230, 214))
    tread = mat('sole_tread', (60, 50, 45))
    accent = mat('shoe_accent', (232, 64, 42))
    cap_m = mat('cap', (232, 64, 42))
    hair = mat('hair', (92, 58, 36))
    eye = mat('eye', (30, 30, 34))
    white = mat('eye_white', (255, 255, 255))
    mouth = mat('mouth', (150, 70, 60))

    parts = []

    # Pelvis: jeans from just under the hoodie to the crotch, thighs hinge at the hip line (0).
    parts.append(join('pelvis', [
        loft(pants, [
            (0.07, 0.13, 0.075, 0.02, 0.0, 2.6), (0.02, 0.155, 0.09, 0.02, 0.0, 2.6), (-0.03, 0.155, 0.092, 0.02, 0.0, 2.4),
            (-0.075, 0.12, 0.085, 0.02, 0.0, 2.2), (-0.105, 0.05, 0.06, 0.02, 0.0, 2),
        ], name='hips'),
    ]))

    # Torso: hoodie from the hem (just under the waist, 0) to the neck (0.5), shoulders at +-0.21, 0.44.
    body = loft(shirt, [
        (-0.005, 0.182, 0.12, 0.01, 0.0, 2.6), (0.08, 0.172, 0.114, 0.005, 0.0, 2.6), (0.18, 0.168, 0.112, 0, -0.004, 2.6),
        (0.3, 0.182, 0.118, 0, -0.008, 2.6), (0.37, 0.19, 0.114, 0, -0.004, 2.8), (0.42, 0.178, 0.104, 0, 0.0, 2.8),
        (0.46, 0.13, 0.088, 0, 0.004, 2.4), (0.49, 0.075, 0.064, 0, 0.004, 2),
    ], cap0=False, name='hoodie')
    hem = loft(shirt_dk, [
        (-0.07, 0.186, 0.13, 0.015, -0.016, 2.6), (-0.06, 0.194, 0.14, 0.015, -0.016, 2.6),
        (-0.01, 0.192, 0.134, 0.012, -0.01, 2.6), (0.0, 0.18, 0.118, 0.01, 0, 2.6),
    ], name='hem')
    t = [body, hem]
    # Hood bunched behind the neck, and a ribbed collar.
    t.append(loft(shirt_dk, [(0.43, 0.1, 0.075, 0, 0.03, 2.4), (0.5, 0.115, 0.085, 0, 0.035, 2.4), (0.545, 0.085, 0.07, 0, 0.045, 2.2)], name='hood'))
    t.append(sphere(shirt, 0.07, loc=(0, 0.075, 0.5), scale=(1.45, 0.75, 0.9), segs=16, rings=10))
    # Kangaroo pocket and drawstrings on the front.
    fy = surface_y(body, 0, 0.14)
    t.append(cube(shirt_dk, (0.2, 0.014, 0.12), loc=(0, fy - 0.003, 0.14), bevel=0.006))
    for s in (1, -1):
        t.append(cyl(string, 0.006, 0.12, loc=(s * 0.03, surface_y(body, s * 0.03, 0.41) - 0.006, 0.41), verts=6))
        t.append(sphere(string, 0.009, loc=(s * 0.03, surface_y(body, s * 0.03, 0.35) - 0.006, 0.35), segs=8, rings=4))
    t.append(cyl(skin, 0.048, 0.1, loc=(0, 0.005, 0.52), verts=14))
    parts.append(join('torso', t))

    # Head: neck pivot at 0, skull centred at 0.16, cap with brim facing -Y. A touch bigger to read in game.
    sk = skull(skin)
    h = [sk, *face(sk, skin, eye, white, hair, mouth), *cap_parts(cap_m), hair_shell(hair)]
    head = join('head', h)
    head.scale = (1.08, 1.08, 1.08)
    apply_tf(head)
    parts.append(head)

    # Arms: hoodie sleeves to the wrist with a ribbed cuff, then the hand.
    for s, side in (('L', 1), ('R', -1)):
        parts.append(join(f'upperArm_{s}', [
            loft(shirt, [
                (0.05, 0.03, 0.03, 0, 0, 2), (0.035, 0.058, 0.056, 0, 0, 2), (0.0, 0.066, 0.062, 0, 0, 2),
                (-0.08, 0.062, 0.058, 0, 0, 2), (-0.2, 0.055, 0.052, 0, 0, 2), (-0.29, 0.052, 0.05, 0, 0, 2),
                (-0.32, 0.045, 0.045, 0, 0, 2), (-0.335, 0.02, 0.02, 0, 0, 2),
            ], segs=18, name='sleeve'),
        ]))
        parts.append(join(f'forearm_{s}', [
            loft(shirt, [
                (0.03, 0.02, 0.02, 0, 0, 2), (0.015, 0.048, 0.046, 0, 0, 2), (-0.02, 0.054, 0.05, 0, 0, 2),
                (-0.12, 0.05, 0.045, 0, 0, 2), (-0.2, 0.042, 0.039, 0, 0, 2),
            ], segs=18, cap1=False, name='sleeve'),
            loft(shirt_dk, [(-0.19, 0.045, 0.042, 0, 0, 2), (-0.235, 0.038, 0.035, 0, 0, 2)], segs=18, name='cuff'),
            cyl(skin, 0.026, 0.05, loc=(0, 0, -0.245), verts=12),
            *hand(skin, side, wrist=-0.255),
        ]))

    # Legs: straight-leg jeans, the shin's top rounds into the knee so the joint never gaps.
    for s in ('L', 'R'):
        parts.append(join(f'thigh_{s}', [
            loft(pants, [
                (0.06, 0.04, 0.04, 0, 0.02, 2), (0.04, 0.068, 0.066, 0, 0.022, 2), (0.0, 0.076, 0.072, 0, 0.018, 2),
                (-0.15, 0.08, 0.08, 0, -0.002, 2), (-0.32, 0.072, 0.072, 0, -0.004, 2), (-0.44, 0.066, 0.068, 0, -0.008, 2),
                (-0.48, 0.05, 0.05, 0, -0.008, 2), (-0.5, 0.02, 0.02, 0, -0.006, 2),
            ], segs=20, name='thigh'),
        ]))
        parts.append(join(f'shin_{s}', [
            sphere(pants, 0.068, loc=(0, -0.008, 0), segs=20, rings=12),
            loft(pants, [
                (0.0, 0.068, 0.068, 0, -0.006, 2), (-0.12, 0.064, 0.062, 0, 0, 2), (-0.3, 0.068, 0.066, 0, 0, 2),
                (-0.4, 0.074, 0.074, 0, -0.008, 2), (-0.43, 0.078, 0.082, 0, -0.016, 2),
            ], segs=20, cap0=False, name='shin'),
            loft(pants_dk, [(-0.405, 0.08, 0.08, 0, -0.01, 2), (-0.44, 0.082, 0.086, 0, -0.018, 2)], segs=20, name='hem'),
        ]))
        parts.append(join(f'shoe_{s}', shoe(shoe_m, sole, accent, tread)))

    # Deck: origin on the ground under the wheels, deck top at 0.115.
    parts.append(build_board())

    # Snow gear, swapped in on the snow biome: a snowboard and a beanie-and-goggles head.
    parts.append(build_snowboard())
    sk = skull(skin)
    head = join('head_snow', [sk, *face(sk, skin, eye, white, hair, mouth), hair_shell(hair), *beanie_parts()])
    head.scale = (1.08, 1.08, 1.08)
    apply_tf(head)
    parts.append(head)

    # Farm gear: a mountain board, and a helmet.
    parts.append(build_mountainboard())
    sk = skull(skin)
    head = join('head_helmet', [sk, *face(sk, skin, eye, white, hair, mouth), *helmet_parts()])
    head.scale = (1.08, 1.08, 1.08)
    apply_tf(head)
    parts.append(head)

    # Scooter gear: a skate helmet.
    sk = skull(skin)
    head = join('head_skatehelmet', [sk, *face(sk, skin, eye, white, hair, mouth), *skate_helmet_parts()])
    head.scale = (1.08, 1.08, 1.08)
    apply_tf(head)
    parts.append(head)
    export(os.path.join(OUT, 'skater.glb'), parts)


def build_board():
    deck_m = mat('deck_grip', (34, 34, 38))
    wood = mat('deck_wood', (216, 140, 58))
    graphic = mat('deck_graphic', (232, 64, 42))
    metal = mat('truck', (184, 190, 198))
    wheel_m = mat('wheel', (245, 230, 168))

    # Deck outline: popsicle shape, kicked nose and tail, slight concave.
    L, W, T = 0.8, 0.21, 0.016
    nx, ny = 40, 8
    bm = bmesh.new()
    top, bot = [], []
    for i in range(nx + 1):
        u = i / nx * 2 - 1  # -1..1 along length
        x = u * L / 2
        half = W / 2
        end = max(0.0, abs(u) - 0.78) / 0.22
        width = half * math.sqrt(max(0.0, 1 - end * end)) if end > 0 else half
        width = max(width, 0.004)
        kick = 0.0
        if abs(u) > 0.62:
            k = (abs(u) - 0.62) / 0.38
            kick = 0.07 * k * k
        rt, rb = [], []
        for j in range(ny + 1):
            v = j / ny * 2 - 1
            y = v * width
            concave = 0.006 * (v * v)
            z = 0.1 + kick + concave
            rt.append(bm.verts.new((x, y, z + T / 2)))
            rb.append(bm.verts.new((x, y, z - T / 2)))
        top.append(rt)
        bot.append(rb)
    faces_top, faces_bot = [], []
    for i in range(nx):
        for j in range(ny):
            faces_top.append(bm.faces.new((top[i][j], top[i + 1][j], top[i + 1][j + 1], top[i][j + 1])))
            faces_bot.append(bm.faces.new((bot[i][j], bot[i][j + 1], bot[i + 1][j + 1], bot[i + 1][j])))
    for i in range(nx):
        bm.faces.new((top[i][0], bot[i][0], bot[i + 1][0], top[i + 1][0]))
        bm.faces.new((top[i][ny], top[i + 1][ny], bot[i + 1][ny], bot[i][ny]))
    for i in (0, nx):
        for j in range(ny):
            f = (top[i][j], top[i][j + 1], bot[i][j + 1], bot[i][j])
            bm.faces.new(f if i == nx else f[::-1])
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-6)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    for f in bm.faces:
        n = f.normal
        f.material_index = 0 if n.z > 0.5 else (1 if n.z < -0.5 else 2)
        c = f.calc_center_median()
        if f.material_index == 1 and abs(c.x) < 0.22:
            f.material_index = 3
    me = bpy.data.meshes.new('deck')
    bm.to_mesh(me)
    bm.free()
    deck = bpy.data.objects.new('deck_body', me)
    bpy.context.collection.objects.link(deck)
    for m in (deck_m, wood, wood, graphic):
        deck.data.materials.append(m)
    for p in deck.data.polygons:
        p.use_smooth = True

    bits = [deck]
    for s in (-1, 1):
        x = s * 0.25
        bits.append(cube(metal, (0.06, 0.06, 0.012), loc=(x, 0, 0.086), bevel=0.004))
        bits.append(cube(metal, (0.035, 0.05, 0.035), loc=(x, 0, 0.065), bevel=0.008))
        bits.append(cube(metal, (0.03, 0.17, 0.024), loc=(x, 0, 0.042), bevel=0.01))
        bits.append(cyl(metal, 0.006, 0.23, loc=(x, 0, 0.03), rot=(math.pi / 2, 0, 0), verts=8))
        for y in (-0.1, 0.1):
            bits.append(cyl(wheel_m, 0.03, 0.034, loc=(x, y, 0.03), rot=(math.pi / 2, 0, 0), verts=20, bevel=0.008))
    return join('deck', bits)


def beanie_parts():
    """Knitted beanie with a turned-up cuff and a bobble, goggles pushed up on the cuff."""
    wool = mat('beanie', (232, 64, 42))
    cuff_m = mat('beanie_cuff', (200, 44, 30))
    bobble = mat('beanie_bobble', (250, 246, 236))
    strap = mat('goggle_strap', (34, 34, 38))
    lens = mat('goggle_lens', (255, 176, 32))
    dome = sphere(wool, 0.138, loc=(0, 0, 0.16), scale=(0.97, 1.02, 1.12), segs=28, rings=16)
    bm = bmesh.new()
    bm.from_mesh(dome.data)
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.co.z < 0.2], context='VERTS')
    bm.to_mesh(dome.data)
    bm.free()
    bits = [dome]
    bits.append(cyl(cuff_m, 0.142, 0.04, loc=(0, 0, 0.212), verts=28, bevel=0.01))
    bits.append(sphere(bobble, 0.038, loc=(0, 0.01, 0.318), segs=14, rings=10))
    # Goggles resting on the cuff: strap round the head, lens at the front (-Y).
    bits.append(cyl(strap, 0.147, 0.02, loc=(0, 0, 0.216), verts=28))
    bits.append(cube(lens, (0.15, 0.03, 0.052), loc=(0, -0.145, 0.218), bevel=0.014, segs=3))
    bits.append(cube(strap, (0.17, 0.02, 0.064), loc=(0, -0.136, 0.218), bevel=0.016, segs=3))
    return bits


def build_snowboard():
    """Snowboard along X, origin on the snow under it, binding baseplates topping out at 0.05.

    The feet stand across the board at x = 0.24 (front) and -0.21 (back), toes towards -Y.
    """
    top_m = mat('snowboard_top', (42, 127, 212))
    graphic = mat('snowboard_graphic', (255, 214, 64))
    base_m = mat('snowboard_base', (244, 244, 244))
    binding = mat('binding', (34, 34, 38))
    strap_m = mat('binding_strap', (232, 64, 42))

    L, W, T = 1.05, 0.25, 0.016
    nx, ny = 64, 8
    bm = bmesh.new()
    top, bot = [], []
    for i in range(nx + 1):
        u = i / nx * 2 - 1
        x = u * L / 2
        # Sidecut: a little narrower at the waist; round nose and tail.
        half = W / 2 * (1 - 0.06 * (1 - u * u))
        end = max(0.0, abs(u) - 0.8) / 0.2
        width = max(half * math.sqrt(max(0.0, 1 - end * end)), 0.004)
        # Twin tips kicked up like a skateboard's nose and tail.
        k = max(0.0, abs(u) - 0.66) / 0.34
        rise = 0.14 * k ** 1.7
        rt, rb = [], []
        for j in range(ny + 1):
            y = (j / ny * 2 - 1) * width
            z = 0.012 + rise
            rt.append(bm.verts.new((x, y, z + T / 2)))
            rb.append(bm.verts.new((x, y, z - T / 2)))
        top.append(rt)
        bot.append(rb)
    for i in range(nx):
        for j in range(ny):
            bm.faces.new((top[i][j], top[i + 1][j], top[i + 1][j + 1], top[i][j + 1]))
            bm.faces.new((bot[i][j], bot[i][j + 1], bot[i + 1][j + 1], bot[i + 1][j]))
    for i in range(nx):
        bm.faces.new((top[i][0], bot[i][0], bot[i + 1][0], top[i + 1][0]))
        bm.faces.new((top[i][ny], top[i + 1][ny], bot[i + 1][ny], bot[i][ny]))
    for i in (0, nx):
        for j in range(ny):
            f = (top[i][j], top[i][j + 1], bot[i][j + 1], bot[i][j])
            bm.faces.new(f if i == nx else f[::-1])
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-6)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    for f in bm.faces:
        n = f.normal
        c = f.calc_center_median()
        if n.z > 0.5:
            # A stripe of graphic down the middle of the top sheet.
            f.material_index = 1 if abs(c.y) < 0.035 else 0
        else:
            f.material_index = 2
    me = bpy.data.meshes.new('snowboard')
    bm.to_mesh(me)
    bm.free()
    board = bpy.data.objects.new('snowboard_body', me)
    bpy.context.collection.objects.link(board)
    for m in (top_m, graphic, base_m):
        board.data.materials.append(m)
    for p in board.data.polygons:
        p.use_smooth = True

    bits = [board]
    for x in (0.24, -0.21):
        # Baseplate under the boot, highback behind the heel (+Y), two straps over the foot.
        bits.append(cube(binding, (0.12, 0.27, 0.02), loc=(x, -0.02, 0.04), bevel=0.008))
        bits.append(cube(binding, (0.12, 0.022, 0.15), loc=(x, 0.125, 0.11), rot=(-0.2, 0, 0), bevel=0.01))
        for s in (1, -1):
            bits.append(cube(binding, (0.012, 0.2, 0.05), loc=(x + s * 0.062, 0.0, 0.065), bevel=0.004))
        bits.append(cube(strap_m, (0.15, 0.05, 0.02), loc=(x, 0.02, 0.135), bevel=0.008))
        bits.append(cube(strap_m, (0.15, 0.04, 0.02), loc=(x, -0.11, 0.1), rot=(0.5, 0, 0), bevel=0.008))
    return join('snowboard', bits)


def helmet_parts():
    """A bike-style helmet: a shell over the skull with vents, a short peak at the front (-Y) and a chin strap."""
    shell_m = mat('helmet', (242, 160, 32))
    vent_m = mat('helmet_vent', (40, 40, 44))
    strap = mat('helmet_strap', (34, 34, 38))
    dome = sphere(shell_m, 0.158, loc=(0, 0.005, 0.17), scale=(0.98, 1.08, 1.0), segs=28, rings=16)
    bm = bmesh.new()
    bm.from_mesh(dome.data)
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.co.z < 0.205 - 0.05 * max(0.0, v.co.y) / 0.16], context='VERTS')
    bm.to_mesh(dome.data)
    bm.free()
    bits = [dome]
    for x in (-0.05, 0.0, 0.05):
        bits.append(cube(vent_m, (0.018, 0.12, 0.02), loc=(x, 0.0, 0.325), bevel=0.006))
    bits.append(cube(shell_m, (0.2, 0.06, 0.012), loc=(0, -0.175, 0.215), rot=(0.25, 0, 0), bevel=0.005))
    for s in (1, -1):
        bits.append(cube(strap, (0.008, 0.012, 0.11), loc=(s * 0.128, -0.02, 0.13), rot=(0.25, 0, 0)))
    return bits


def skate_helmet_parts():
    """A skate helmet: a round, smooth shell that comes down low at the back and sides, no peak,
    a few round vents, a sticker and a chin strap. The face is at -Y."""
    shell_m = mat('skate_helmet', (226, 48, 52))
    vent_m = mat('helmet_vent', (40, 40, 44))
    sticker = mat('skate_helmet_sticker', (255, 214, 64))
    strap = mat('helmet_strap', (34, 34, 38))
    dome = sphere(shell_m, 0.166, loc=(0, 0.01, 0.17), scale=(1.0, 1.06, 1.0), segs=32, rings=18)
    bm = bmesh.new()
    bm.from_mesh(dome.data)
    # Low over the ears and the back of the head, up above the eyebrows at the front.
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.co.z < 0.13 - 0.07 * max(0.0, -v.co.y) / 0.16 + 0.0 * v.co.y], context='VERTS')
    bm.to_mesh(dome.data)
    bm.free()
    bits = [dome]
    # Round vents: two over the forehead, two at the back.
    for x in (-0.045, 0.045):
        for y, z, a in ((-0.11, 0.29, -0.75), (0.12, 0.29, 0.75)):
            bits.append(cyl(vent_m, 0.016, 0.02, loc=(x, y, z), rot=(a, 0, 0), verts=14))
    bits.append(cube(sticker, (0.006, 0.07, 0.04), loc=(0.163, 0.02, 0.2), rot=(0, 0, 0), bevel=0.004))
    for s in (1, -1):
        bits.append(cube(strap, (0.008, 0.012, 0.11), loc=(s * 0.13, -0.01, 0.1), rot=(0.2, 0, 0)))
    return bits


def build_mountainboard():
    """Mountain board along X, origin on the ground under its tyres, deck top at 0.2.

    Feet stand across the deck at x = 0.24 (front) and -0.21 (back) in loop bindings.
    """
    deck_m = mat('mtb_deck', (60, 150, 70))
    grip = mat('deck_grip', (34, 34, 38))
    metal = mat('truck', (184, 190, 198))
    tyre_m = mat('tyre', (42, 40, 40))
    hub_m = mat('mtb_hub', (240, 200, 40))
    strap_m = mat('binding_strap', (232, 64, 42))

    L, W, T = 0.98, 0.24, 0.022
    nx, ny = 48, 8
    bm = bmesh.new()
    top, bot = [], []
    for i in range(nx + 1):
        u = i / nx * 2 - 1
        x = u * L / 2
        end = max(0.0, abs(u) - 0.82) / 0.18
        width = max(W / 2 * math.sqrt(max(0.0, 1 - end * end)), 0.004)
        k = max(0.0, abs(u) - 0.7) / 0.3
        z = 0.189 + 0.06 * k * k
        rt, rb = [], []
        for j in range(ny + 1):
            y = (j / ny * 2 - 1) * width
            rt.append(bm.verts.new((x, y, z + T / 2)))
            rb.append(bm.verts.new((x, y, z - T / 2)))
        top.append(rt)
        bot.append(rb)
    for i in range(nx):
        for j in range(ny):
            bm.faces.new((top[i][j], top[i + 1][j], top[i + 1][j + 1], top[i][j + 1]))
            bm.faces.new((bot[i][j], bot[i][j + 1], bot[i + 1][j + 1], bot[i + 1][j]))
    for i in range(nx):
        bm.faces.new((top[i][0], bot[i][0], bot[i + 1][0], top[i + 1][0]))
        bm.faces.new((top[i][ny], top[i + 1][ny], bot[i + 1][ny], bot[i][ny]))
    for i in (0, nx):
        for j in range(ny):
            f = (top[i][j], top[i][j + 1], bot[i][j + 1], bot[i][j])
            bm.faces.new(f if i == nx else f[::-1])
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-6)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    for f in bm.faces:
        f.material_index = 1 if f.normal.z > 0.5 else 0
    me = bpy.data.meshes.new('mountainboard')
    bm.to_mesh(me)
    bm.free()
    board = bpy.data.objects.new('mountainboard_body', me)
    bpy.context.collection.objects.link(board)
    for m in (deck_m, grip):
        board.data.materials.append(m)
    for p in board.data.polygons:
        p.use_smooth = True

    bits = [board]
    R = 0.085
    for s in (-1, 1):
        x = s * 0.34
        # Baseplate and a chunky skate-style truck with a long axle.
        bits.append(cube(metal, (0.08, 0.08, 0.016), loc=(x, 0, 0.17), bevel=0.004))
        bits.append(cube(metal, (0.045, 0.06, 0.06), loc=(x, 0, 0.135), bevel=0.01))
        bits.append(cube(metal, (0.035, 0.26, 0.03), loc=(x, 0, R + 0.01), bevel=0.012))
        bits.append(cyl(metal, 0.008, 0.38, loc=(x, 0, R), rot=(math.pi / 2, 0, 0), verts=8))
        for y in (-0.165, 0.165):
            # A knobbly pneumatic tyre on a yellow hub.
            bits.append(cyl(tyre_m, R, 0.07, loc=(x, y, R), rot=(math.pi / 2, 0, 0), verts=24, bevel=0.025))
            bits.append(cyl(hub_m, R * 0.5, 0.074, loc=(x, y, R), rot=(math.pi / 2, 0, 0), verts=16, bevel=0.006))
            for k in range(12):
                a = k * math.pi / 6
                bits.append(cube(tyre_m, (0.018, 0.064, 0.012), loc=(x + (R - 0.002) * math.cos(a), y, R + (R - 0.002) * math.sin(a)), rot=(0, -a + math.pi / 2, 0)))
    for x in (0.24, -0.21):
        # Loop bindings: a padded strap arching over the foot, and a heel cup behind (+Y).
        for k in range(7):
            a = math.pi * k / 6
            bits.append(cube(strap_m, (0.06, 0.05, 0.018), loc=(x, -0.02 + 0.09 * math.cos(a), 0.2 + 0.075 * math.sin(a)), rot=(a - math.pi / 2, 0, 0)))
        bits.append(cube(grip, (0.1, 0.02, 0.05), loc=(x, 0.11, 0.225), bevel=0.008))
    return join('mountainboard', bits)


# ---------------------------------------------------------------- scooter

def scooter_wheel(tyre_m, core_m, bolt_m, R=0.06, W=0.026):
    """A stunt scooter wheel at the origin, axle along Y: urethane tyre on a metal core with spokes."""
    bits = [cyl(tyre_m, R, W, rot=(math.pi / 2, 0, 0), verts=28, bevel=0.009)]
    bits.append(cyl(core_m, R * 0.7, W + 0.004, rot=(math.pi / 2, 0, 0), verts=24, bevel=0.003))
    # Cut-outs between the spokes read as dark windows in the core.
    for k in range(6):
        a = k * math.pi / 3 + math.pi / 6
        for side in (1, -1):
            bits.append(cyl(tyre_m, R * 0.16, 0.003, loc=(R * 0.42 * math.cos(a), side * (W / 2 + 0.002), R * 0.42 * math.sin(a)), rot=(math.pi / 2, 0, 0), verts=10))
    bits.append(cyl(bolt_m, R * 0.18, W + 0.012, rot=(math.pi / 2, 0, 0), verts=12, bevel=0.002))
    return bits


def scooter_bars(frame_m, bar_m, grip_m, clamp_m, bolt_m, top):
    """Fork crown, clamp, T-bars with gussets and grips; `top` is the grip height. Steering axis up Z at x = 0."""
    bits = []
    bits.append(cyl(clamp_m, 0.031, 0.07, loc=(0, 0, 0.345), verts=20, bevel=0.006))
    for z in (0.325, 0.365):
        bits.append(cube(bolt_m, (0.016, 0.03, 0.012), loc=(-0.034, 0, z), bevel=0.003))
    bits.append(cyl(bar_m, 0.017, top - 0.38, loc=(0, 0, (top + 0.38) / 2), verts=16))
    bits.append(cyl(bar_m, 0.015, 0.56, loc=(0, 0, top), rot=(math.pi / 2, 0, 0), verts=16))
    # Gussets bracing the crossbar to the downtube.
    for s in (1, -1):
        bits.append(cyl(bar_m, 0.008, 0.13, loc=(0, s * 0.05, top - 0.045), rot=(s * 0.85, 0, 0), verts=10))
        # Grips with a flange on the inside and a bar-end plug.
        bits.append(cyl(grip_m, 0.021, 0.12, loc=(0, s * (GRIP_Z_M), top), rot=(math.pi / 2, 0, 0), verts=18, bevel=0.006))
        bits.append(cyl(grip_m, 0.027, 0.012, loc=(0, s * (GRIP_Z_M - 0.066), top), rot=(math.pi / 2, 0, 0), verts=18, bevel=0.003))
        bits.append(cyl(frame_m, 0.018, 0.008, loc=(0, s * (GRIP_Z_M + 0.062), top), rot=(math.pi / 2, 0, 0), verts=14))
    return bits


GRIP_Z_M = 0.22
SCOOTER_GRIP = 0.88


def build_scooter():
    """Stunt scooter and snow scooter, two parts each, origin on the ground under the front axle.

    The steering axis is straight up through the front axle. `*_deck` (deck, back wheel or rear
    ski, head tube) whips round it; `*_bars` (bars, fork, front wheel or front ski) spins round it.
    The deck runs back along -X; its top is at 0.105 (0.135 on the snow scooter), grips at 0.88.
    """
    reset()
    frame_m = mat('scooter_frame', (122, 79, 216))
    frame_dk = mat('scooter_frame_dark', (88, 52, 170))
    grip_tape = mat('scooter_grip', (34, 34, 38))
    graphic = mat('scooter_graphic', (255, 214, 64))
    bar_m = mat('scooter_bar', (196, 202, 212))
    grip_m = mat('scooter_handgrip', (40, 38, 42))
    tyre_m = mat('scooter_tyre', (255, 210, 63))
    core_m = mat('scooter_core', (190, 196, 204))
    bolt_m = mat('scooter_bolt', (70, 72, 78))
    ski_m = mat('snowscoot_ski', (232, 64, 42))
    ski_base = mat('snowscoot_base', (244, 244, 244))
    R = 0.06
    xb = -0.60  # back axle

    def deck_plate(z0, lift):
        """Deck from the neck back to the dropouts: rounded box, grip tape on top, a stripe of graphic, deck end at the back."""
        bits = []
        bits.append(cube(frame_m, (0.47, 0.118, 0.03), loc=(-0.31, 0, z0 + 0.015), bevel=0.012, segs=3))
        bits.append(cube(grip_tape, (0.43, 0.1, 0.003), loc=(-0.31, 0, z0 + 0.031)))
        bits.append(cube(graphic, (0.36, 0.122, 0.008), loc=(-0.31, 0, z0 + 0.012)))
        # Neck rising forward to the head tube.
        bits.append(cube(frame_m, (0.12, 0.07, 0.035), loc=(-0.06, 0, z0 + 0.05 + lift * 0.3), rot=(0, -0.55, 0), bevel=0.01))
        bits.append(cyl(frame_m, 0.028, 0.17, loc=(0, 0, 0.225 + lift), verts=20, bevel=0.004))
        bits.append(cyl(frame_dk, 0.031, 0.012, loc=(0, 0, 0.145 + lift), verts=20))
        bits.append(cyl(frame_dk, 0.031, 0.012, loc=(0, 0, 0.305 + lift), verts=20))
        return bits

    # --- wheeled scooter
    d = deck_plate(0.075, 0.0)
    for s in (1, -1):
        # Dropouts round the back wheel, and a flex fender over it to brake with.
        d.append(cube(frame_m, (0.11, 0.009, 0.05), loc=(xb + 0.03, s * 0.022, 0.075), bevel=0.003))
    d.append(cube(bar_m, (0.12, 0.05, 0.006), loc=(xb + 0.0, 0, R * 2 + 0.012), rot=(0, 0.12, 0), bevel=0.002))
    for b in scooter_wheel(tyre_m, core_m, bolt_m, R):
        b.location.x += xb
        b.location.z += R
        d.append(b)
    parts = [join('scooter_deck', d)]
    bars = scooter_bars(frame_m, bar_m, grip_m, frame_dk, bolt_m, SCOOTER_GRIP)
    # Fork: crown under the head tube, legs down to the axle.
    bars.append(cube(frame_m, (0.05, 0.07, 0.025), loc=(0, 0, 0.13), bevel=0.008))
    for s in (1, -1):
        bars.append(cube(frame_m, (0.022, 0.012, 0.085), loc=(0.004, s * 0.024, 0.088), bevel=0.004))
    for b in scooter_wheel(tyre_m, core_m, bolt_m, R):
        b.location.z += R
        bars.append(b)
    parts.append(join('scooter_bars', bars))

    # --- snow scooter: the deck stands on a short board, the fork on a front ski.
    lift = 0.03

    def board(name_m, x0, x1, w, nose):
        """A short ski board along X from x0 to x1, turned up at the front (and the back if `nose` is 2)."""
        nx, ny, T = 40, 6, 0.018
        bm = bmesh.new()
        top, bot = [], []
        for i in range(nx + 1):
            u = i / nx
            x = x0 + (x1 - x0) * u
            tip = max(0.0, (u - 0.8) / 0.2)
            tail = max(0.0, (0.2 - u) / 0.2) if nose == 2 else 0.0
            rise = 0.07 * tip ** 1.6 + 0.04 * tail ** 1.6
            end = max(tip, tail)
            half = max(w / 2 * math.sqrt(max(0.0, 1 - (max(0.0, end - 0.5) / 0.5) ** 2)), 0.004)
            rt, rb = [], []
            for j in range(ny + 1):
                y = (j / ny * 2 - 1) * half
                rt.append(bm.verts.new((x, y, 0.01 + rise + T / 2)))
                rb.append(bm.verts.new((x, y, 0.01 + rise - T / 2)))
            top.append(rt)
            bot.append(rb)
        for i in range(nx):
            for j in range(ny):
                bm.faces.new((top[i][j], top[i + 1][j], top[i + 1][j + 1], top[i][j + 1]))
                bm.faces.new((bot[i][j], bot[i][j + 1], bot[i + 1][j + 1], bot[i + 1][j]))
        for i in range(nx):
            bm.faces.new((top[i][0], bot[i][0], bot[i + 1][0], top[i + 1][0]))
            bm.faces.new((top[i][ny], top[i + 1][ny], bot[i + 1][ny], bot[i][ny]))
        for i in (0, nx):
            for j in range(ny):
                f = (top[i][j], top[i][j + 1], bot[i][j + 1], bot[i][j])
                bm.faces.new(f if i == nx else f[::-1])
        bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-6)
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        for f in bm.faces:
            f.material_index = 0 if f.normal.z > 0.3 else 1
        me = bpy.data.meshes.new('ski')
        bm.to_mesh(me)
        bm.free()
        o = bpy.data.objects.new('ski', me)
        bpy.context.collection.objects.link(o)
        o.data.materials.append(name_m)
        o.data.materials.append(ski_base)
        for p in o.data.polygons:
            p.use_smooth = True
        return o

    d = deck_plate(0.075 + lift, lift)
    d.append(board(ski_m, -0.78, -0.12, 0.2, 2))
    # Risers lifting the deck off the board.
    for x in (-0.48, -0.16):
        d.append(cube(frame_dk, (0.05, 0.09, 0.07), loc=(x, 0, 0.065), bevel=0.008))
    parts.append(join('snowscoot_deck', d))
    bars = scooter_bars(frame_m, bar_m, grip_m, frame_dk, bolt_m, SCOOTER_GRIP + lift)
    bars.append(cube(frame_m, (0.05, 0.07, 0.025), loc=(0, 0, 0.13 + lift), bevel=0.008))
    for s in (1, -1):
        bars.append(cube(frame_m, (0.022, 0.012, 0.12), loc=(0.004, s * 0.024, 0.08 + lift), bevel=0.004))
    bars.append(cube(frame_dk, (0.08, 0.07, 0.04), loc=(0.0, 0, 0.045), bevel=0.01))
    bars.append(board(ski_m, -0.16, 0.26, 0.17, 1))
    parts.append(join('snowscoot_bars', bars))
    # Every part turns about the front axle, so put its origin there rather than at its first piece.
    bpy.context.scene.cursor.location = (0, 0, 0)
    for o in parts:
        bpy.ops.object.select_all(action='DESELECT')
        o.select_set(True)
        bpy.context.view_layer.objects.active = o
        bpy.ops.object.origin_set(type='ORIGIN_CURSOR')
    export(os.path.join(OUT, 'scooter.glb'), parts)


# ---------------------------------------------------------------- props

def build_props():
    reset()
    out = []
    bark = mat('bark', (122, 82, 50))
    leaf = mat('leaf', (63, 154, 69))
    leaf2 = mat('leaf_light', (92, 184, 84))
    leaf3 = mat('leaf_dark', (48, 128, 62))
    rock_m = mat('rock', (150, 152, 156))
    wood = mat('fence_wood', (197, 139, 82))
    wood_dk = mat('fence_wood_dark', (160, 108, 60))
    steel = mat('lamp_steel', (60, 70, 82))
    light = mat('lamp_light', (255, 243, 176))
    cone_m = mat('cone', (255, 122, 26))
    white = mat('white', (245, 245, 245))
    bench_wood = mat('bench_wood', (181, 112, 58))
    iron = mat('iron', (68, 68, 72))

    # Tree: tapered trunk with a couple of branches and a lumpy crown.
    trunk = cyl(bark, 0.22, 2.2, loc=(0, 0, 1.1), r2=0.12, verts=10)
    br1 = cyl(bark, 0.08, 0.9, loc=(0.25, 0, 1.9), rot=(0, math.radians(40), 0), r2=0.04, verts=8)
    br2 = cyl(bark, 0.07, 0.8, loc=(-0.22, 0.05, 2.0), rot=(0, math.radians(-35), 0), r2=0.035, verts=8)
    crown = [
        ico(leaf, 1.25, loc=(0, 0, 3.0), sub=2, jitter=0.25, seed=1, smooth=True),
        ico(leaf2, 0.9, loc=(0.7, -0.3, 3.5), sub=2, jitter=0.25, seed=2, smooth=True),
        ico(leaf3, 0.95, loc=(-0.7, 0.2, 2.8), sub=2, jitter=0.25, seed=3, smooth=True),
        ico(leaf2, 0.75, loc=(0.1, -0.4, 3.9), sub=2, jitter=0.25, seed=4, smooth=True),
    ]
    out.append(join('tree', [trunk, br1, br2] + crown))

    # Pine tree variant reads well in the distance.
    pine = [cyl(bark, 0.14, 1.0, loc=(0, 0, 0.5), verts=8)]
    for i, (r, z) in enumerate([(1.1, 1.3), (0.85, 2.1), (0.6, 2.8)]):
        pine.append(cyl(leaf3 if i % 2 == 0 else leaf, r, 1.2, loc=(0, 0, z), r2=0.05, verts=9, smooth=False))
    out.append(join('pine', pine))

    out.append(join('bush', [
        ico(leaf, 0.6, loc=(0, 0, 0.42), sub=2, jitter=0.3, seed=5, smooth=True),
        ico(leaf2, 0.45, loc=(0.5, -0.1, 0.32), sub=2, jitter=0.3, seed=6, smooth=True),
        ico(leaf3, 0.42, loc=(-0.45, 0.1, 0.3), sub=2, jitter=0.3, seed=7, smooth=True),
    ]))

    out.append(join('rock', [
        ico(rock_m, 0.55, loc=(0, 0, 0.2), scale=(1.2, 0.9, 0.65), sub=1, jitter=0.35, seed=8),
        ico(rock_m, 0.3, loc=(0.55, 0.15, 0.1), scale=(1, 0.9, 0.7), sub=1, jitter=0.35, seed=9),
    ]))

    # Fence: one 2.4 m bay, post on the left, two rails.
    out.append(join('fence', [
        cube(wood_dk, (0.12, 0.12, 1.05), loc=(-1.2, 0, 0.52), bevel=0.015),
        cube(wood_dk, (0.14, 0.14, 0.04), loc=(-1.2, 0, 1.06), bevel=0.01),
        cube(wood, (2.4, 0.05, 0.11), loc=(0, 0.04, 0.78), bevel=0.012),
        cube(wood, (2.4, 0.05, 0.11), loc=(0, 0.04, 0.42), bevel=0.012),
    ]))

    # Lamp post with an arm reaching over the track (+X is along the track, -Y towards camera).
    out.append(join('lamp', [
        cyl(steel, 0.11, 0.25, loc=(0, 0, 0.12), verts=12),
        cyl(steel, 0.06, 4.0, loc=(0, 0, 2.1), r2=0.045, verts=12),
        cyl(steel, 0.035, 0.9, loc=(0, -0.42, 4.05), rot=(math.radians(90), 0, 0), verts=8),
        cube(steel, (0.3, 0.42, 0.12), loc=(0, -0.85, 4.02), bevel=0.03),
        cube(light, (0.24, 0.34, 0.03), loc=(0, -0.85, 3.95), bevel=0.01),
    ]))

    out.append(join('cone', [
        cube(cone_m, (0.42, 0.42, 0.04), loc=(0, 0, 0.02), bevel=0.01),
        cyl(cone_m, 0.17, 0.55, loc=(0, 0, 0.3), r2=0.025, verts=16),
        cyl(white, 0.122, 0.09, loc=(0, 0, 0.3), r2=0.1, verts=16),
    ]))

    out.append(join('bench', [
        cube(bench_wood, (1.7, 0.12, 0.05), loc=(0, -0.12, 0.46), bevel=0.012),
        cube(bench_wood, (1.7, 0.12, 0.05), loc=(0, 0.04, 0.46), bevel=0.012),
        cube(bench_wood, (1.7, 0.05, 0.12), loc=(0, 0.17, 0.72), bevel=0.012),
        cube(bench_wood, (1.7, 0.05, 0.12), loc=(0, 0.19, 0.88), bevel=0.012),
        cube(iron, (0.06, 0.4, 0.06), loc=(-0.72, 0, 0.42), bevel=0.01),
        cube(iron, (0.06, 0.4, 0.06), loc=(0.72, 0, 0.42), bevel=0.01),
        cube(iron, (0.06, 0.06, 0.45), loc=(-0.72, -0.16, 0.22), bevel=0.01),
        cube(iron, (0.06, 0.06, 0.45), loc=(0.72, -0.16, 0.22), bevel=0.01),
        cube(iron, (0.06, 0.06, 0.95), loc=(-0.72, 0.16, 0.47), bevel=0.01),
        cube(iron, (0.06, 0.06, 0.95), loc=(0.72, 0.16, 0.47), bevel=0.01),
    ]))

    build_beach(out)
    build_city(out)
    build_snow(out)
    build_desert(out)
    build_jungle(out)
    build_volcano(out)
    build_farm(out)
    build_candy(out)
    build_docks(out)
    build_pirate(out)
    build_haunted(out)
    build_funfair(out)
    build_toxic(out)
    build_mine(out)
    build_dino(out)
    build_moon(out)
    build_sky(out)
    export(os.path.join(OUT, 'props.glb'), out)



# ---------------------------------------------------------------- biome props

def bend_strip(material, length, width, droop, segs=8, loc=(0, 0, 0), yaw=0.0, pitch=0.0, taper=True):
    """A drooping leaf strip (palm frond) built along +X, then rotated."""
    bm = bmesh.new()
    rows = []
    for i in range(segs + 1):
        t = i / segs
        x = t * length
        z = -droop * t * t
        w = width * (math.sin(math.pi * min(1.0, t * 1.15)) if taper else 1.0) + 0.01
        rows.append((bm.verts.new((x, -w / 2, z)), bm.verts.new((x, 0, z + w * 0.15)), bm.verts.new((x, w / 2, z))))
    for a, b in zip(rows, rows[1:]):
        bm.faces.new((a[0], b[0], b[1], a[1]))
        bm.faces.new((a[1], b[1], b[2], a[2]))
    me = bpy.data.meshes.new('strip')
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new('strip', me)
    bpy.context.collection.objects.link(o)
    o.rotation_euler = (0, pitch, yaw)
    o.location = loc
    apply_tf(o)
    o = finish(o, material, True)
    sol = o.modifiers.new('sol', 'SOLIDIFY')
    sol.thickness = 0.02
    bpy.context.view_layer.objects.active = o
    bpy.ops.object.modifier_apply(modifier='sol')
    return o


def striped_cone(mats, r, depth, loc, verts=12, r2=0.0):
    o = cyl(mats[0], r, depth, loc=loc, r2=r2, verts=verts, smooth=False)
    for m in mats[1:]:
        o.data.materials.append(m)
    for i, p in enumerate(o.data.polygons):
        c = p.center
        ang = math.atan2(c.y - loc[1], c.x - loc[0])
        p.material_index = int(((ang + math.pi) / (2 * math.pi)) * verts) % len(mats)
    return o


def build_beach(out):
    trunk = mat('palm_trunk', (166, 120, 78))
    trunk_dk = mat('palm_trunk_dark', (128, 90, 56))
    frond = mat('palm_frond', (70, 168, 72))
    frond2 = mat('palm_frond_light', (110, 196, 86))
    coconut = mat('coconut', (110, 72, 40))
    red = mat('red', (230, 60, 50))
    white = mat('white', (245, 245, 245))
    yellow = mat('yellow', (255, 206, 60))
    blue = mat('sea_blue', (40, 150, 220))
    wood = mat('beach_wood', (214, 168, 110))
    wood_dk = mat('beach_wood_dark', (150, 108, 66))
    rope = mat('rope', (222, 196, 140))
    teal = mat('teal', (40, 190, 180))

    # Palm: leaning segmented trunk, drooping fronds, coconuts.
    parts = []
    lean = 0.35
    top = Vector((0, 0, 0))
    n = 9
    for i in range(n):
        t0, t1 = i / n, (i + 1) / n
        p0 = Vector((lean * t0 * t0 * 1.6, 0, 4.2 * t0))
        p1 = Vector((lean * t1 * t1 * 1.6, 0, 4.2 * t1))
        mid = (p0 + p1) / 2
        d = p1 - p0
        rot = (0, math.atan2(d.x, d.z), 0)
        r = 0.2 - 0.07 * t0
        parts.append(cyl(trunk if i % 2 == 0 else trunk_dk, r, d.length * 1.02, loc=tuple(mid), rot=rot, r2=r * 0.86, verts=10))
        top = p1
    for k in range(7):
        yaw = k * 2 * math.pi / 7 + 0.3
        parts.append(bend_strip(frond if k % 2 else frond2, 1.9, 0.42, 0.9, loc=tuple(top), yaw=yaw, pitch=-0.25))
    for k in range(3):
        a = k * 2.1
        parts.append(sphere(coconut, 0.11, loc=(top.x + 0.13 * math.cos(a), 0.13 * math.sin(a), top.z - 0.15), segs=10, rings=8))
    out.append(join('palm', parts))

    # Beach umbrella with towel.
    out.append(join('umbrella', [
        cyl(white, 0.03, 2.2, loc=(0, 0, 1.1), verts=8),
        striped_cone([red, white], 1.1, 0.5, loc=(0, 0, 2.15), verts=12, r2=0.02),
        cube(teal, (1.6, 0.8, 0.02), loc=(0.6, -0.9, 0.01)),
        cube(white, (0.3, 0.8, 0.021), loc=(0.6, -0.9, 0.012)),
    ]))

    # Lifeguard tower.
    lg = []
    for x in (-0.6, 0.6):
        for y in (-0.6, 0.6):
            lg.append(cube(white, (0.1, 0.1, 2.0), loc=(x, y, 1.0), bevel=0.01))
    lg += [
        cube(wood, (1.5, 1.5, 0.1), loc=(0, 0, 2.0), bevel=0.01),
        cube(red, (1.3, 1.2, 0.9), loc=(0, 0.1, 2.5), bevel=0.02),
        cube(white, (1.0, 0.05, 0.4), loc=(0, -0.5, 2.6), bevel=0.01),
        cube(white, (1.6, 1.6, 0.08), loc=(0, 0.1, 3.0), rot=(math.radians(-8), 0, 0), bevel=0.02),
        cube(wood_dk, (0.5, 1.6, 0.06), loc=(0, -1.25, 1.0), rot=(math.radians(-50), 0, 0), bevel=0.01),
        cyl(red, 0.25, 0.08, loc=(0.75, -0.3, 2.5), rot=(0, math.pi / 2, 0), verts=16),
    ]
    out.append(join('lifeguard', lg))

    # Surf shack.
    sh = [
        cube(wood, (2.4, 1.8, 1.9), loc=(0, 0, 0.95), bevel=0.02),
        cube(wood_dk, (2.9, 2.3, 0.12), loc=(0, 0, 2.0), rot=(math.radians(-10), 0, 0), bevel=0.02),
        cube(wood_dk, (2.0, 0.2, 0.08), loc=(0, -1.0, 1.0), bevel=0.01),
        cube(blue, (1.6, 0.05, 0.6), loc=(0, -0.92, 1.5), bevel=0.01),
        cube(yellow, (1.4, 0.06, 0.35), loc=(0, -0.95, 2.25), bevel=0.01),
    ]
    for x in (-1.0, 1.0):
        sh.append(cyl(wood_dk, 0.06, 1.2, loc=(x, -1.15, 1.5), verts=8))
    out.append(join('shack', sh))

    # Rope fence: post plus a sagging rope to the next post 2.4 m along.
    rf = [cyl(wood_dk, 0.07, 1.0, loc=(-1.2, 0, 0.5), verts=8), sphere(wood_dk, 0.08, loc=(-1.2, 0, 1.0), segs=8, rings=6)]
    pts = [(-1.2 + 2.4 * i / 6, 0.85 - 0.18 * math.sin(math.pi * i / 6)) for i in range(7)]
    for (x0, z0), (x1, z1) in zip(pts, pts[1:]):
        d = math.hypot(x1 - x0, z1 - z0)
        rf.append(cyl(rope, 0.02, d * 1.05, loc=((x0 + x1) / 2, 0, (z0 + z1) / 2), rot=(0, math.atan2(x1 - x0, z1 - z0), 0), verts=6))
    out.append(join('ropefence', rf))

    # Surfboard stuck upright in the sand.
    board = sphere(yellow, 0.5, loc=(0, 0, 0.85), scale=(0.55, 0.09, 2.0), segs=20, rings=14)
    stripe = sphere(red, 0.5, loc=(0, -0.002, 0.85), scale=(0.12, 0.092, 1.98), segs=12, rings=14)
    out.append(join('surfboard', [board, stripe]))

    out.append(join('beachball', [striped_cone([red, white, blue, yellow], 0.25, 0.0001, loc=(0, 0, 0.25), verts=8)] if False else [
        sphere(red, 0.25, loc=(0, 0, 0.25), segs=16, rings=10),
        sphere(white, 0.252, loc=(0, 0, 0.25), scale=(0.35, 1, 1), segs=16, rings=10),
    ]))


def build_city(out):
    steel = mat('city_steel', (120, 128, 140))
    steel_dk = mat('city_steel_dark', (70, 76, 88))
    tank_wood = mat('tank_wood', (150, 100, 64))
    tank_band = mat('tank_band', (60, 60, 66))
    brick = mat('brick', (170, 80, 60))
    brick_cap = mat('brick_cap', (110, 110, 116))
    ac = mat('ac_unit', (205, 210, 214))
    grille = mat('grille', (60, 64, 70))
    red = mat('red', (230, 60, 50))
    white = mat('white', (245, 245, 245))

    # Water tank on legs.
    wt = []
    for x in (-0.8, 0.8):
        for y in (-0.8, 0.8):
            wt.append(cube(steel_dk, (0.1, 0.1, 2.0), loc=(x, y, 1.0)))
    wt += [
        cube(steel_dk, (1.9, 1.9, 0.1), loc=(0, 0, 2.0)),
        cyl(tank_wood, 1.0, 2.2, loc=(0, 0, 3.15), verts=20),
        cyl(tank_band, 1.03, 0.08, loc=(0, 0, 2.5), verts=20),
        cyl(tank_band, 1.03, 0.08, loc=(0, 0, 3.4), verts=20),
        cyl(tank_band, 1.08, 0.7, loc=(0, 0, 4.6), r2=0.05, verts=20, smooth=False),
    ]
    out.append(join('watertank', wt))

    out.append(join('acunit', [
        cube(ac, (1.2, 0.9, 0.9), loc=(0, 0, 0.45), bevel=0.04),
        cyl(grille, 0.32, 0.04, loc=(0, -0.45, 0.48), rot=(math.pi / 2, 0, 0), verts=20),
        cube(grille, (0.05, 0.02, 0.5), loc=(0, -0.475, 0.48)),
        cube(grille, (0.5, 0.02, 0.05), loc=(0, -0.475, 0.48)),
    ]))

    out.append(join('chimney', [
        cube(brick, (0.7, 0.7, 1.6), loc=(0, 0, 0.8), bevel=0.02),
        cube(brick_cap, (0.85, 0.85, 0.12), loc=(0, 0, 1.62), bevel=0.02),
        cyl(steel_dk, 0.12, 0.4, loc=(0.1, 0, 1.85), verts=10),
    ]))

    out.append(join('antenna', [
        cyl(steel_dk, 0.05, 4.5, loc=(0, 0, 2.25), verts=8),
        cube(steel_dk, (1.4, 0.04, 0.04), loc=(0, 0, 3.6)),
        cube(steel_dk, (1.0, 0.04, 0.04), loc=(0, 0, 4.0)),
        cube(steel_dk, (0.6, 0.04, 0.04), loc=(0, 0, 4.4)),
        sphere(red, 0.07, loc=(0, 0, 4.55), segs=10, rings=6),
        cyl(white, 0.45, 0.18, loc=(0.2, -0.2, 2.2), rot=(math.radians(60), 0, math.radians(20)), r2=0.12, verts=16),
    ]))

    rl = [cyl(steel, 0.035, 1.1, loc=(-1.2, 0, 0.55), verts=8), cyl(steel, 0.035, 1.1, loc=(0, 0, 0.55), verts=8)]
    rl.append(cyl(steel, 0.03, 2.4, loc=(0, 0, 1.08), rot=(0, math.pi / 2, 0), verts=8))
    rl.append(cyl(steel, 0.025, 2.4, loc=(0, 0, 0.6), rot=(0, math.pi / 2, 0), verts=8))
    out.append(join('railing', rl))

    out.append(join('vent', [
        cyl(steel, 0.18, 0.7, loc=(0, 0, 0.35), verts=14),
        cyl(steel_dk, 0.32, 0.18, loc=(0, 0, 0.82), r2=0.08, verts=14),
        cyl(steel, 0.2, 0.06, loc=(0, 0, 0.72), verts=14),
    ]))


def build_snow(out):
    snow = mat('snow', (240, 246, 252))
    snow_sh = mat('snow_shade', (210, 226, 242))
    pine = mat('pine_dark', (34, 104, 72))
    pine2 = mat('pine_mid', (46, 124, 84))
    bark = mat('bark', (122, 82, 50))
    log = mat('log', (140, 90, 52))
    log_dk = mat('log_dark', (100, 62, 36))
    window = mat('window_glow', (255, 214, 120))
    orange = mat('orange', (255, 120, 30))
    coal = mat('coal', (40, 40, 44))
    red = mat('red', (230, 60, 50))
    steel = mat('city_steel', (120, 128, 140))
    rock_m = mat('rock', (150, 152, 156))

    sp = [cyl(bark, 0.15, 1.0, loc=(0, 0, 0.5), verts=8)]
    for i, (r, z) in enumerate([(1.2, 1.3), (0.95, 2.1), (0.7, 2.85), (0.45, 3.5)]):
        sp.append(cyl(pine if i % 2 == 0 else pine2, r, 1.1, loc=(0, 0, z), r2=0.05, verts=9, smooth=False))
        sp.append(cyl(snow, r * 0.62, 0.42, loc=(0, 0, z + 0.36), r2=0.05, verts=9, smooth=False))
    out.append(join('snowpine', sp))

    cb = []
    for i in range(7):
        z = 0.15 + i * 0.28
        cb.append(cyl(log if i % 2 else log_dk, 0.15, 3.2, loc=(0, -1.1, z), rot=(0, math.pi / 2, 0), verts=10))
        cb.append(cyl(log if i % 2 == 0 else log_dk, 0.15, 2.4, loc=(-1.45, 0, z), rot=(math.pi / 2, 0, 0), verts=10))
        cb.append(cyl(log if i % 2 == 0 else log_dk, 0.15, 2.4, loc=(1.45, 0, z), rot=(math.pi / 2, 0, 0), verts=10))
    cb += [
        cube(log_dk, (2.9, 2.2, 1.95), loc=(0, 0, 1.0)),
        cube(snow, (3.6, 1.6, 0.18), loc=(0, -0.65, 2.45), rot=(math.radians(35), 0, 0), bevel=0.05),
        cube(snow, (3.6, 1.6, 0.18), loc=(0, 0.65, 2.45), rot=(math.radians(-35), 0, 0), bevel=0.05),
        cube(log_dk, (0.6, 0.06, 1.1), loc=(0.6, -1.27, 0.55)),
        cube(window, (0.6, 0.06, 0.5), loc=(-0.7, -1.27, 1.1)),
        cube(log_dk, (0.7, 0.07, 0.08), loc=(-0.7, -1.29, 1.1)),
        cube(rock_m, (0.45, 0.45, 1.4), loc=(1.0, 0.4, 2.7), bevel=0.03),
        cube(snow, (0.55, 0.55, 0.12), loc=(1.0, 0.4, 3.42), bevel=0.04),
    ]
    out.append(join('cabin', cb))

    out.append(join('snowman', [
        sphere(snow, 0.45, loc=(0, 0, 0.42), segs=18, rings=12),
        sphere(snow, 0.33, loc=(0, 0, 1.0), segs=18, rings=12),
        sphere(snow, 0.24, loc=(0, 0, 1.45), segs=18, rings=12),
        cyl(orange, 0.04, 0.22, loc=(0, -0.3, 1.45), rot=(math.pi / 2, 0, 0), r2=0.005, verts=8),
        sphere(coal, 0.03, loc=(0.08, -0.21, 1.53), segs=8, rings=6),
        sphere(coal, 0.03, loc=(-0.08, -0.21, 1.53), segs=8, rings=6),
        sphere(coal, 0.035, loc=(0, -0.32, 1.08), segs=8, rings=6),
        sphere(coal, 0.035, loc=(0, -0.33, 0.92), segs=8, rings=6),
        cyl(red, 0.26, 0.1, loc=(0, 0, 1.24), verts=16),
        cube(red, (0.1, 0.05, 0.35), loc=(0.15, -0.24, 1.08), rot=(0, math.radians(-15), 0)),
        cyl(coal, 0.22, 0.04, loc=(0, 0, 1.64), verts=16),
        cyl(coal, 0.15, 0.25, loc=(0, 0, 1.78), verts=16),
        cyl(bark, 0.02, 0.6, loc=(0.42, 0, 1.1), rot=(0, math.radians(60), 0), verts=6),
        cyl(bark, 0.02, 0.6, loc=(-0.42, 0, 1.1), rot=(0, math.radians(-60), 0), verts=6),
    ]))

    out.append(join('liftpylon', [
        cyl(steel, 0.18, 7.0, loc=(0, 0, 3.5), r2=0.12, verts=10),
        cube(steel, (0.2, 3.0, 0.2), loc=(0, 0, 7.0)),
        cyl(red, 0.25, 0.1, loc=(0, -1.3, 6.85), rot=(0, math.pi / 2, 0), verts=14),
        cyl(red, 0.25, 0.1, loc=(0, 1.3, 6.85), rot=(0, math.pi / 2, 0), verts=14),
        cube(snow, (0.5, 0.5, 0.15), loc=(0, 0, 0.07), bevel=0.04),
    ]))

    sf = [cyl(log_dk, 0.04, 1.2, loc=(-1.2, 0, 0.6), verts=6)]
    for i in range(5):
        sf.append(cube(orange, (2.4, 0.02, 0.07), loc=(0, 0, 0.25 + i * 0.2)))
    for i in range(9):
        sf.append(cube(orange, (0.05, 0.02, 0.9), loc=(-1.0 + i * 0.25, 0, 0.6)))
    out.append(join('snowfence', sf))

    out.append(join('snowrock', [
        ico(rock_m, 0.6, loc=(0, 0, 0.25), scale=(1.3, 1.0, 0.75), sub=1, jitter=0.35, seed=11),
        ico(snow, 0.55, loc=(0, 0, 0.5), scale=(1.25, 0.95, 0.35), sub=1, jitter=0.25, seed=12, smooth=True),
    ]))


def build_desert(out):
    cactus = mat('cactus', (78, 150, 84))
    cactus_dk = mat('cactus_dark', (58, 122, 66))
    flower = mat('cactus_flower', (240, 90, 140))
    red_rock = mat('red_rock', (196, 104, 64))
    red_rock2 = mat('red_rock_light', (222, 140, 90))
    sand_rock = mat('sand_rock', (214, 170, 110))
    bone = mat('bone', (236, 226, 204))
    tumble = mat('tumbleweed', (170, 130, 80))
    wood_dk = mat('fence_wood_dark', (160, 108, 60))

    cc = [capsule(cactus, 0.22, 0.24, 3.0, loc=(0, 0, 3.0))]
    cc += [
        capsule(cactus_dk, 0.13, 0.14, 0.8, loc=(0.5, 0, 2.2)),
        cyl(cactus_dk, 0.13, 0.4, loc=(0.32, 0, 1.4), rot=(0, math.pi / 2, 0), verts=12),
        capsule(cactus_dk, 0.12, 0.13, 0.7, loc=(-0.45, 0, 2.5)),
        cyl(cactus_dk, 0.12, 0.35, loc=(-0.3, 0, 1.85), rot=(0, math.pi / 2, 0), verts=12),
        sphere(flower, 0.07, loc=(0, 0, 3.02), segs=10, rings=6),
    ]
    out.append(join('cactus', cc))

    out.append(join('barrelcactus', [
        sphere(cactus, 0.32, loc=(0, 0, 0.28), scale=(1, 1, 0.9), segs=12, rings=8, smooth=False),
        sphere(flower, 0.06, loc=(0, 0, 0.57), segs=8, rings=6),
    ]))

    # Layered sandstone butte for the middle distance.
    mesa = []
    for i, (w, h, z, m) in enumerate([(6, 3, 1.5, red_rock), (5, 2.5, 4.2, red_rock2), (4.2, 2.4, 6.6, red_rock), (3.6, 0.5, 8.0, sand_rock)]):
        mesa.append(ico(m, 1, loc=(0, 0, z), scale=(w / 2, w / 2.6, h / 2), sub=1, jitter=0.15, seed=20 + i))
    out.append(join('mesa', mesa))

    out.append(join('desertrock', [
        ico(red_rock, 0.7, loc=(0, 0, 0.3), scale=(1.3, 1.0, 0.7), sub=1, jitter=0.35, seed=31),
        ico(red_rock2, 0.4, loc=(0.7, 0.2, 0.15), scale=(1, 0.9, 0.8), sub=1, jitter=0.35, seed=32),
    ]))

    tw = []
    for k in range(5):
        tw.append(ico(tumble, 0.35, loc=(0, 0, 0.35), scale=(1, 1, 1), sub=1, jitter=0.4, seed=40 + k))
        tw[-1].rotation_euler = (k, k * 0.7, k * 1.3)
        apply_tf(tw[-1])
    for o in tw:
        w = o.modifiers.new('wf', 'WIREFRAME')
        w.thickness = 0.03
        bpy.context.view_layer.objects.active = o
        bpy.ops.object.modifier_apply(modifier='wf')
    out.append(join('tumbleweed', tw))

    out.append(join('skull', [
        sphere(bone, 0.18, loc=(0, 0, 0.14), scale=(1, 1.3, 0.8), segs=12, rings=8),
        cyl(bone, 0.04, 0.5, loc=(0.25, 0.1, 0.25), rot=(0, math.radians(60), 0), r2=0.01, verts=8),
        cyl(bone, 0.04, 0.5, loc=(-0.25, 0.1, 0.25), rot=(0, math.radians(-60), 0), r2=0.01, verts=8),
    ]))

    out.append(join('signpost', [
        cube(wood_dk, (0.1, 0.1, 1.8), loc=(0, 0, 0.9)),
        cube(wood_dk, (0.9, 0.05, 0.25), loc=(0.3, -0.06, 1.5), rot=(0, math.radians(-8), 0), bevel=0.01),
        cube(wood_dk, (0.8, 0.05, 0.22), loc=(-0.25, -0.06, 1.15), rot=(0, math.radians(6), 0), bevel=0.01),
    ]))


def build_jungle(out):
    trunk = mat('jungle_trunk', (110, 84, 60))
    leaf = mat('jungle_leaf', (40, 150, 70))
    leaf2 = mat('jungle_leaf_light', (90, 190, 80))
    leaf3 = mat('jungle_leaf_dark', (28, 110, 60))
    stone = mat('temple_stone', (150, 150, 130))
    stone_dk = mat('temple_stone_dark', (110, 112, 96))
    moss = mat('moss', (90, 150, 60))
    flower = mat('jungle_flower', (250, 80, 90))
    yellow = mat('yellow', (255, 206, 60))

    jt = [cyl(trunk, 0.3, 6.0, loc=(0, 0, 3.0), r2=0.18, verts=10)]
    for i in range(4):
        a = i * math.pi / 2 + 0.4
        jt.append(cyl(trunk, 0.12, 1.6, loc=(0.5 * math.cos(a), 0.5 * math.sin(a), 5.2), rot=(math.sin(a) * -0.9, math.cos(a) * 0.9, 0), r2=0.06, verts=8))
    for i, (x, y, z, r, m) in enumerate([(0, 0, 6.4, 1.8, leaf), (1.2, 0.3, 5.9, 1.3, leaf2), (-1.2, -0.2, 6.0, 1.4, leaf3), (0.3, -0.8, 6.9, 1.1, leaf2)]):
        jt.append(ico(m, r, loc=(x, y, z), scale=(1, 1, 0.55), sub=2, jitter=0.25, seed=50 + i, smooth=True))
    for k in range(6):
        jt.append(cyl(leaf3, 0.025, 1.5 + (k % 3) * 0.6, loc=(-1.2 + k * 0.5, -0.3, 5.0 - (k % 3) * 0.3), verts=5))
    out.append(join('jungletree', jt))

    fn = []
    for k in range(8):
        yaw = k * 2 * math.pi / 8
        fn.append(bend_strip(leaf if k % 2 else leaf2, 1.0, 0.3, 0.5, loc=(0, 0, 0.35), yaw=yaw, pitch=-0.7))
    fn.append(sphere(flower, 0.08, loc=(0.1, 0, 0.55), segs=8, rings=6))
    out.append(join('fern', fn))

    pl = [
        cube(stone_dk, (0.9, 0.9, 0.3), loc=(0, 0, 0.15), bevel=0.03),
        cyl(stone, 0.32, 3.0, loc=(0, 0, 1.8), verts=12),
        cube(stone_dk, (0.95, 0.95, 0.3), loc=(0, 0, 3.4), bevel=0.03),
        ico(moss, 0.35, loc=(0.2, -0.3, 3.55), scale=(1.4, 1.2, 0.4), sub=1, jitter=0.3, seed=61, smooth=True),
        ico(moss, 0.3, loc=(-0.25, -0.25, 1.0), scale=(0.8, 0.6, 1.4), sub=1, jitter=0.3, seed=62, smooth=True),
    ]
    out.append(join('pillar', pl))

    out.append(join('stonehead', [
        cube(stone, (1.2, 1.0, 1.5), loc=(0, 0, 0.75), bevel=0.12, segs=2),
        cube(stone_dk, (1.3, 0.3, 0.25), loc=(0, -0.42, 1.15), bevel=0.04),
        cube(stone_dk, (0.25, 0.35, 0.5), loc=(0, -0.55, 0.85), bevel=0.05),
        cube(stone_dk, (0.6, 0.15, 0.12), loc=(0, -0.5, 0.45), bevel=0.03),
        cube(yellow, (0.18, 0.06, 0.1), loc=(0.3, -0.5, 1.15)),
        cube(yellow, (0.18, 0.06, 0.1), loc=(-0.3, -0.5, 1.15)),
        ico(moss, 0.5, loc=(0, 0, 1.55), scale=(1.3, 1.1, 0.35), sub=1, jitter=0.3, seed=63, smooth=True),
    ]))

    rw = []
    for i in range(3):
        for j in range(3 - (i % 2)):
            rw.append(cube(stone if (i + j) % 2 else stone_dk, (0.75, 0.5, 0.45), loc=(-0.8 + j * 0.8 + (i % 2) * 0.4, 0, 0.23 + i * 0.47), bevel=0.04))
    rw.append(ico(moss, 0.4, loc=(0.3, -0.1, 1.45), scale=(1.6, 0.8, 0.4), sub=1, jitter=0.3, seed=64, smooth=True))
    out.append(join('ruinwall', rw))


def build_volcano(out):
    basalt = mat('basalt', (58, 54, 60))
    basalt2 = mat('basalt_light', (84, 78, 86))
    lava = mat('lava', (255, 110, 30))
    charred = mat('charred', (44, 36, 34))
    ember = mat('ember', (255, 70, 40))

    bc = []
    for i, (x, y, h) in enumerate([(0, 0, 2.6), (0.55, 0.1, 1.8), (-0.5, 0.15, 2.1), (0.1, 0.55, 1.4), (-0.2, -0.45, 1.1)]):
        bc.append(cyl(basalt if i % 2 else basalt2, 0.3, h, loc=(x, y, h / 2), verts=6, smooth=False))
    out.append(join('basalt', bc))

    dt = [cyl(charred, 0.18, 2.6, loc=(0, 0, 1.3), r2=0.08, verts=8)]
    for i, (a, z, l) in enumerate([(0.7, 1.8, 1.0), (-0.8, 2.1, 0.9), (2.4, 1.5, 0.8)]):
        dt.append(cyl(charred, 0.06, l, loc=(0.35 * math.cos(a), 0.35 * math.sin(a), z + 0.2), rot=(math.sin(a) * 0.9, math.cos(a) * 0.9, 0), r2=0.02, verts=6))
    dt.append(sphere(ember, 0.05, loc=(0.1, -0.15, 1.0), segs=6, rings=4))
    out.append(join('deadtree', dt))

    out.append(join('lavarock', [
        ico(basalt, 0.7, loc=(0, 0, 0.3), scale=(1.3, 1.0, 0.7), sub=1, jitter=0.35, seed=71),
        ico(lava, 0.2, loc=(0.3, -0.45, 0.25), scale=(1.2, 0.5, 0.6), sub=1, jitter=0.2, seed=72, smooth=True),
        ico(lava, 0.15, loc=(-0.4, -0.4, 0.4), scale=(1, 0.5, 0.6), sub=1, jitter=0.2, seed=73, smooth=True),
    ]))

    out.append(join('vent_rock', [
        cyl(basalt2, 0.9, 0.9, loc=(0, 0, 0.45), r2=0.4, verts=10, smooth=False),
        cyl(lava, 0.38, 0.05, loc=(0, 0, 0.9), verts=10),
    ]))


def build_farm(out):
    straw = mat('straw', (232, 196, 108))
    straw_dk = mat('straw_dark', (196, 156, 76))
    twine = mat('twine', (160, 110, 60))
    pumpkin_m = mat('pumpkin', (242, 128, 32))
    pumpkin_dk = mat('pumpkin_dark', (214, 98, 22))
    stem = mat('stem', (96, 120, 50))
    bark = mat('bark', (122, 82, 50))
    leaf = mat('leaf', (63, 154, 69))
    leaf2 = mat('leaf_light', (92, 184, 84))
    leaf3 = mat('leaf_dark', (48, 128, 62))
    apple = mat('apple', (214, 40, 40))
    corn_leaf = mat('corn_leaf', (110, 168, 60))
    corn_leaf2 = mat('corn_leaf_dry', (176, 182, 80))
    cob = mat('corn_cob', (250, 210, 70))
    plaid = mat('plaid_shirt', (200, 60, 50))
    denim = mat('denim', (60, 90, 150))
    hat = mat('hat_straw', (210, 170, 90))
    barn_red = mat('barn_red', (176, 48, 40))
    wood = mat('fence_wood', (197, 139, 82))
    wood_dk = mat('fence_wood_dark', (160, 108, 60))
    white = mat('white', (245, 245, 245))
    hen = mat('hen', (236, 230, 220))
    comb = mat('comb', (220, 40, 40))
    beak = mat('beak', (250, 180, 40))
    steel = mat('churn_steel', (170, 178, 186))
    petal = mat('sunflower', (255, 200, 30))
    seed = mat('sunflower_seed', (90, 60, 30))
    iron = mat('iron', (68, 68, 72))
    water = mat('trough_water', (90, 150, 190))

    # Round hay bale lying on its side, with the rolled spiral showing on the end.
    hb = [cyl(straw, 0.75, 1.3, loc=(0, 0, 0.75), rot=(math.pi / 2, 0, 0), verts=20, bevel=0.06)]
    for r in (0.55, 0.35, 0.15):
        hb.append(cyl(straw_dk, r, 0.02, loc=(0, -0.66, 0.75), rot=(math.pi / 2, 0, 0), verts=20))
        hb.append(cyl(straw, r - 0.08, 0.025, loc=(0, -0.665, 0.75), rot=(math.pi / 2, 0, 0), verts=20))
    for y in (-0.35, 0.35):
        hb.append(cyl(twine, 0.765, 0.04, loc=(0, y, 0.75), rot=(math.pi / 2, 0, 0), verts=20))
    out.append(join('haybale', hb))

    # Square straw bale, with two strings round it.
    sb = [cube(straw, (1.0, 0.5, 0.45), loc=(0, 0, 0.225), bevel=0.04)]
    for x in (-0.25, 0.25):
        sb.append(cube(twine, (0.03, 0.52, 0.47), loc=(x, 0, 0.225)))
    sb.append(cube(straw_dk, (0.9, 0.02, 0.35), loc=(0, -0.255, 0.225)))
    out.append(join('strawbale', sb))

    # Pumpkin: ribs as squashed spheres round a core, and a curly stem.
    pk = []
    for k in range(8):
        a = k * 2 * math.pi / 8
        pk.append(sphere(pumpkin_m if k % 2 else pumpkin_dk, 0.2, loc=(0.13 * math.cos(a), 0.13 * math.sin(a), 0.24), scale=(1, 0.75, 1.1), segs=14, rings=10))
    pk.append(sphere(pumpkin_m, 0.24, loc=(0, 0, 0.25), scale=(1, 1, 0.95), segs=16, rings=10))
    pk.append(cyl(stem, 0.035, 0.16, loc=(0.02, 0, 0.52), rot=(0, 0.3, 0), r2=0.025, verts=8))
    pk.append(bend_strip(stem, 0.25, 0.12, 0.08, loc=(0.03, 0, 0.5), yaw=0.8, pitch=0.2))
    out.append(join('pumpkin', pk))

    # Scarecrow: post and crossbar, plaid shirt, straw head, floppy hat, straw at the cuffs.
    sc = [
        cyl(wood_dk, 0.05, 2.2, loc=(0, 0, 1.1), verts=8),
        cyl(wood_dk, 0.04, 1.6, loc=(0, 0, 1.6), rot=(0, math.pi / 2, 0), verts=8),
        cube(plaid, (0.5, 0.28, 0.6), loc=(0, 0, 1.35), bevel=0.06),
        cube(plaid, (1.3, 0.2, 0.18), loc=(0, 0, 1.6), bevel=0.05),
        cube(denim, (0.48, 0.27, 0.35), loc=(0, 0, 0.95), bevel=0.05),
        sphere(straw, 0.2, loc=(0, 0, 1.92), scale=(1, 0.9, 1.1), segs=14, rings=10),
        cyl(hat, 0.36, 0.03, loc=(0, 0, 2.08), verts=18),
        cyl(hat, 0.17, 0.2, loc=(0, 0, 2.17), r2=0.13, verts=14),
        cube(iron, (0.05, 0.02, 0.05), loc=(-0.07, -0.18, 1.95)),
        cube(iron, (0.05, 0.02, 0.05), loc=(0.07, -0.18, 1.95)),
        cube(iron, (0.14, 0.02, 0.03), loc=(0, -0.18, 1.85)),
    ]
    for x in (-0.72, 0.72):
        for k in range(3):
            sc.append(cyl(straw, 0.02, 0.22, loc=(x + (0.06 if x > 0 else -0.06), 0, 1.6 + (k - 1) * 0.05), rot=(0, (1 if x > 0 else -1) * (1.2 + k * 0.2), 0), verts=5))
    out.append(join('scarecrow', sc))

    # Maize: a clump of tall stalks with long drooping leaves and a cob or two.
    cn = []
    for i, (x, y, h) in enumerate([(0, 0, 2.3), (0.35, 0.15, 2.0), (-0.3, 0.2, 2.15), (0.1, -0.3, 1.9), (-0.15, -0.15, 2.4)]):
        cn.append(cyl(corn_leaf, 0.07, h, loc=(x, y, h / 2), r2=0.035, verts=6))
        for k in range(4):
            z = h * (0.35 + k * 0.17)
            cn.append(bend_strip(corn_leaf if (i + k) % 3 else corn_leaf2, 0.85, 0.3, 0.4, loc=(x, y, z), yaw=k * 2.3 + i, pitch=-0.4))
        cn.append(capsule(mat('corn_tassel', (214, 170, 90)), 0.04, 0.02, 0.3, loc=(x, y, h + 0.25), segs=6))
        if i % 2 == 0:
            cn.append(capsule(cob, 0.045, 0.04, 0.22, loc=(x + 0.06, y, h * 0.62), segs=8))
    out.append(join('corn', cn))

    # Apple tree: short trunk, round crown dotted with apples.
    at = [cyl(bark, 0.2, 1.6, loc=(0, 0, 0.8), r2=0.14, verts=10)]
    at += [
        cyl(bark, 0.08, 0.8, loc=(0.25, 0, 1.6), rot=(0, math.radians(45), 0), r2=0.04, verts=8),
        cyl(bark, 0.07, 0.7, loc=(-0.22, 0.05, 1.7), rot=(0, math.radians(-40), 0), r2=0.035, verts=8),
    ]
    for i, (x, y, z, r, m) in enumerate([(0, 0, 2.3, 1.15, leaf), (0.75, -0.2, 2.1, 0.8, leaf2), (-0.75, 0.1, 2.15, 0.85, leaf3), (0.1, -0.3, 2.85, 0.75, leaf2)]):
        at.append(ico(m, r, loc=(x, y, z), sub=2, jitter=0.22, seed=90 + i, smooth=True))
    # Apples sit on the outside of the crown, mostly on the side facing the track.
    import random
    rnd = random.Random(7)
    crowns = [(0, 0, 2.3, 1.15), (0.75, -0.2, 2.1, 0.8), (-0.75, 0.1, 2.15, 0.85), (0.1, -0.3, 2.85, 0.75)]
    for k in range(18):
        cx, cy, cz, cr = crowns[k % 4]
        a = rnd.uniform(-math.pi * 0.95, -math.pi * 0.05)
        e = rnd.uniform(-0.5, 0.7)
        d = Vector((math.cos(a) * math.cos(e), math.sin(a) * math.cos(e), math.sin(e)))
        at.append(sphere(apple, 0.11, loc=(cx + d.x * cr * 0.97, cy + d.y * cr * 0.97, cz + d.z * cr * 0.97), segs=10, rings=8))
    out.append(join('appletree', at))

    # Hen.
    out.append(join('chicken', [
        sphere(hen, 0.16, loc=(0, 0, 0.24), scale=(1.3, 0.9, 1), segs=12, rings=8),
        sphere(hen, 0.09, loc=(0.17, 0, 0.4), segs=10, rings=8),
        cyl(hen, 0.1, 0.18, loc=(-0.2, 0, 0.33), rot=(0, math.radians(-30), 0), r2=0.02, verts=8),
        cube(comb, (0.06, 0.02, 0.07), loc=(0.18, 0, 0.5)),
        cyl(beak, 0.03, 0.07, loc=(0.27, 0, 0.4), rot=(0, math.pi / 2, 0), r2=0.0, verts=6),
        cube(comb, (0.03, 0.02, 0.05), loc=(0.24, 0, 0.34)),
        cyl(beak, 0.012, 0.14, loc=(0.03, 0.05, 0.07), verts=5),
        cyl(beak, 0.012, 0.14, loc=(0.03, -0.05, 0.07), verts=5),
    ]))

    # Milk churn.
    out.append(join('milkchurn', [
        cyl(steel, 0.2, 0.5, loc=(0, 0, 0.25), verts=16),
        cyl(steel, 0.2, 0.15, loc=(0, 0, 0.57), r2=0.09, verts=16),
        cyl(steel, 0.09, 0.12, loc=(0, 0, 0.7), verts=14),
        cyl(steel, 0.12, 0.04, loc=(0, 0, 0.77), verts=14),
        cyl(iron, 0.205, 0.03, loc=(0, 0, 0.12), verts=16),
        cyl(iron, 0.205, 0.03, loc=(0, 0, 0.42), verts=16),
    ]))

    # Sunflower: tall stem, two leaves, a big face looking towards the track.
    sf = [cyl(stem, 0.03, 1.9, loc=(0, 0, 0.95), verts=6)]
    sf.append(bend_strip(leaf, 0.35, 0.18, 0.1, loc=(0, 0, 0.8), yaw=0.3, pitch=-0.3))
    sf.append(bend_strip(leaf2, 0.35, 0.18, 0.1, loc=(0, 0, 1.2), yaw=3.4, pitch=-0.3))
    # The face looks out towards the track (-Y).
    sf.append(cyl(seed, 0.17, 0.08, loc=(0, -0.05, 1.98), rot=(math.pi / 2, 0, 0), verts=18))
    for k in range(14):
        a = k * 2 * math.pi / 14
        sf.append(cube(petal, (0.1, 0.03, 0.2), loc=(0.27 * math.cos(a), -0.03, 1.98 + 0.27 * math.sin(a)), rot=(0, math.pi / 2 - a, 0)))
    out.append(join('sunflower', sf))

    # Farm fence: one 2.4 m bay, a post on the left, three rails.
    ff = [cube(wood_dk, (0.14, 0.14, 1.15), loc=(-1.2, 0, 0.57), bevel=0.015)]
    for z in (0.3, 0.62, 0.94):
        ff.append(cube(wood, (2.4, 0.05, 0.12), loc=(0, 0.05, z), bevel=0.012))
    out.append(join('farmfence', ff))

    # Hay cart: a wooden bed on two big wheels, piled with hay.
    ct = [
        cube(wood, (2.2, 1.1, 0.12), loc=(0, 0, 0.8), bevel=0.02),
        cube(wood_dk, (2.2, 0.06, 0.35), loc=(0, -0.55, 1.0), bevel=0.01),
        cube(wood_dk, (2.2, 0.06, 0.35), loc=(0, 0.55, 1.0), bevel=0.01),
        cube(wood_dk, (0.06, 1.1, 0.35), loc=(-1.1, 0, 1.0), bevel=0.01),
        cube(wood_dk, (1.4, 0.07, 0.07), loc=(1.75, 0, 0.6), rot=(0, math.radians(18), 0)),
        ico(straw, 0.75, loc=(0, 0, 1.15), scale=(1.4, 0.7, 0.55), sub=2, jitter=0.25, seed=95, smooth=True),
    ]
    for y in (-0.62, 0.62):
        ct.append(cyl(wood_dk, 0.55, 0.08, loc=(0.1, y, 0.55), rot=(math.pi / 2, 0, 0), verts=18))
        ct.append(cyl(wood, 0.45, 0.09, loc=(0.1, y, 0.55), rot=(math.pi / 2, 0, 0), verts=18))
        for k in range(4):
            ct.append(cube(wood_dk, (0.9, 0.1, 0.05), loc=(0.1, y, 0.55), rot=(0, k * math.pi / 4, 0)))
    out.append(join('cart', ct))

    # Water trough.
    out.append(join('trough', [
        cube(steel, (1.6, 0.6, 0.5), loc=(0, 0, 0.35), bevel=0.04),
        cube(water, (1.5, 0.5, 0.02), loc=(0, 0, 0.6)),
        cube(wood_dk, (0.1, 0.5, 0.1), loc=(-0.6, 0, 0.05)),
        cube(wood_dk, (0.1, 0.5, 0.1), loc=(0.6, 0, 0.05)),
    ]))

    # Barn-red gate post with a little lantern, every so often along the track.
    out.append(join('farmpost', [
        cube(wood_dk, (0.18, 0.18, 1.8), loc=(0, 0, 0.9), bevel=0.02),
        cube(barn_red, (0.24, 0.24, 0.06), loc=(0, 0, 1.83), bevel=0.01),
        cube(iron, (0.03, 0.35, 0.03), loc=(0, -0.17, 1.65)),
        cube(iron, (0.16, 0.16, 0.22), loc=(0, -0.35, 1.5), bevel=0.02),
        cube(mat('lamp_light', (255, 243, 176)), (0.11, 0.11, 0.15), loc=(0, -0.35, 1.5)),
    ]))


def swirl_disc(mats, r, thick, loc, turns=3):
    """A flat lollipop: a disc in mats[0] with a spiral of mats[1] on both faces."""
    parts = [cyl(mats[0], r, thick, loc=loc, rot=(math.pi / 2, 0, 0), verts=32)]
    for side in (-1, 1):
        cd = bpy.data.curves.new('swirl', 'CURVE')
        cd.dimensions = '3D'
        cd.bevel_depth = r * 0.07
        cd.bevel_resolution = 2
        sp = cd.splines.new('POLY')
        n = 90
        sp.points.add(n - 1)
        for i in range(n):
            t = i / (n - 1)
            ang = side * t * turns * 2 * math.pi
            rr = r * 0.9 * t
            sp.points[i].co = (loc[0] + rr * math.cos(ang), loc[1] + side * thick * 0.45, loc[2] + rr * math.sin(ang), 1)
        o = bpy.data.objects.new('swirl', cd)
        bpy.context.collection.objects.link(o)
        bpy.context.view_layer.objects.active = o
        o.select_set(True)
        bpy.ops.object.convert(target='MESH')
        o = bpy.context.object
        parts.append(finish(o, mats[1], True))
    return parts


def build_candy(out):
    pink = mat('candy_pink', (255, 110, 170))
    white = mat('white', (245, 245, 245))
    red = mat('candy_red', (230, 40, 60))
    mint = mat('candy_mint', (110, 220, 170))
    lemon = mat('candy_lemon', (255, 220, 70))
    grape = mat('candy_grape', (160, 100, 230))
    orange = mat('candy_orange', (255, 150, 50))
    blue = mat('candy_blue', (90, 180, 255))
    stick = mat('lolly_stick', (250, 246, 236))
    sponge = mat('sponge', (240, 200, 130))
    choc = mat('chocolate', (110, 62, 36))
    cream = mat('cream', (255, 246, 236))
    cone_m = mat('wafer', (220, 160, 80))
    floss = mat('candyfloss', (255, 180, 220))
    floss2 = mat('candyfloss_blue', (170, 210, 255))
    cherry = mat('cherry', (220, 30, 50))
    glow = mat('lamp_light', (255, 243, 176))

    # Lollipop: a big swirl on a stick.
    out.append(join('lollipop', [
        cyl(stick, 0.05, 2.0, loc=(0, 0, 1.0), verts=8),
    ] + swirl_disc([pink, white], 0.6, 0.16, loc=(0, 0, 2.4))))

    # Candy floss tree: a white stick trunk with fluffy pink and blue puffs.
    ct = [cyl(stick, 0.14, 2.0, loc=(0, 0, 1.0), r2=0.1, verts=10)]
    for i, (x, y, z, r, m) in enumerate([(0, 0, 2.6, 1.1, floss), (0.75, -0.2, 2.35, 0.75, floss2), (-0.75, 0.15, 2.4, 0.8, floss), (0.15, -0.35, 3.2, 0.7, floss2)]):
        ct.append(ico(m, r, loc=(x, y, z), sub=3, jitter=0.12, seed=120 + i, smooth=True))
    out.append(join('candytree', ct))

    # Gumdrop: a sugary dome.
    out.append(join('gumdrop', [sphere(mint, 0.35, loc=(0, 0, 0.3), scale=(1, 1, 1.15), segs=16, rings=10)] +
        [sphere(white, 0.025, loc=(0.32 * math.cos(a) * math.cos(e), 0.32 * math.sin(a) * math.cos(e), 0.3 + 0.38 * math.sin(e)), segs=6, rings=4)
         for a, e in [(k * 1.3, 0.3 + (k % 4) * 0.25) for k in range(14)]]))

    # Candy cane stuck in the ground, red and white stripes.
    cc = []
    n = 10
    for i in range(n):
        cc.append(cyl(red if i % 2 else white, 0.09, 1.8 / n + 0.005, loc=(0, 0, 1.8 * (i + 0.5) / n), verts=12))
    for i in range(7):
        a = math.pi * i / 6
        cc.append(sphere(red if i % 2 else white, 0.095, loc=(0.32 - 0.32 * math.cos(a), 0, 1.8 + 0.32 * math.sin(a)), segs=12, rings=8))
    out.append(join('candycane', cc))

    # Cupcake: a ridged wrapper, swirly icing, a cherry.
    cu = [cyl(pink, 0.42, 0.55, loc=(0, 0, 0.27), r2=0.52, verts=16, smooth=False)]
    for k, (r, z) in enumerate([(0.55, 0.65), (0.45, 0.85), (0.32, 1.02), (0.18, 1.15)]):
        cu.append(sphere(cream, r, loc=(0, 0, z), scale=(1, 1, 0.5), segs=16, rings=8))
    cu.append(sphere(cherry, 0.11, loc=(0, 0, 1.3), segs=10, rings=8))
    out.append(join('cupcake', cu))

    # Ice cream cone stuck point down in the ground, two scoops.
    out.append(join('icecream', [
        cyl(cone_m, 0.32, 1.0, loc=(0, 0, 0.5), r2=0.03, verts=12, smooth=False),
        sphere(mint, 0.36, loc=(0, 0, 1.15), segs=14, rings=10),
        sphere(pink, 0.32, loc=(0, 0, 1.6), segs=14, rings=10),
        sphere(cherry, 0.08, loc=(0, 0, 1.95), segs=8, rings=6),
    ]))

    # Giant doughnut standing on its edge, with icing and sprinkles.
    dn = []
    bpy.ops.mesh.primitive_torus_add(major_radius=0.55, minor_radius=0.25, location=(0, 0, 0.8), rotation=(math.pi / 2, 0, 0), major_segments=24, minor_segments=10)
    dn.append(finish(bpy.context.object, sponge, True))
    bpy.ops.mesh.primitive_torus_add(major_radius=0.55, minor_radius=0.22, location=(0, -0.06, 0.8), rotation=(math.pi / 2, 0, 0), major_segments=24, minor_segments=10)
    ic = bpy.context.object
    ic.scale = (1.02, 0.7, 1.02)
    apply_tf(ic)
    dn.append(finish(ic, pink, True))
    for k, m in enumerate([lemon, blue, white, mint, grape] * 3):
        a = k * 2 * math.pi / 15
        dn.append(cube(m, (0.08, 0.03, 0.025), loc=(0.55 * math.cos(a), -0.27, 0.8 + 0.55 * math.sin(a)), rot=(0, k * 0.9, 0)))
    out.append(join('donut', dn))

    # A wrapped sweet lying in the grass.
    out.append(join('sweet', [
        sphere(orange, 0.25, loc=(0, 0, 0.22), scale=(1.4, 1, 1), segs=14, rings=8),
        cyl(white, 0.18, 0.25, loc=(0.48, 0, 0.22), rot=(0, math.pi / 2, 0), r2=0.02, verts=10),
        cyl(white, 0.18, 0.25, loc=(-0.48, 0, 0.22), rot=(0, -math.pi / 2, 0), r2=0.02, verts=10),
    ]))

    # Candy cane fence: one 2.4 m bay, a striped post and two striped rails.
    cf = []
    for i in range(5):
        cf.append(cyl(red if i % 2 else white, 0.07, 0.22, loc=(-1.2, 0, 0.11 + i * 0.22), verts=10))
    cf.append(sphere(red, 0.09, loc=(-1.2, 0, 1.13), segs=10, rings=6))
    for z in (0.45, 0.85):
        for i in range(8):
            cf.append(cyl(red if i % 2 else white, 0.045, 0.3, loc=(-1.2 + 0.15 + i * 0.3, 0.03, z), rot=(0, math.pi / 2, 0), verts=8))
    out.append(join('canefence', cf))

    # Gumball lamp: a striped post with a glowing gumball on top.
    out.append(join('gumlamp', [cyl(red if i % 2 else white, 0.07, 0.3, loc=(0, 0, 0.15 + i * 0.3), verts=10) for i in range(8)] + [
        cyl(lemon, 0.18, 0.08, loc=(0, 0, 2.42), verts=14),
        sphere(glow, 0.22, loc=(0, 0, 2.66), segs=14, rings=10),
        cyl(lemon, 0.12, 0.06, loc=(0, 0, 2.9), verts=12),
    ]))


def container_prop(name, colour, rib_colour):
    """A 20 ft shipping container, corrugated sides, doors on one end, corner castings."""
    body = mat(name + '_paint', colour)
    rib = mat(name + '_rib', rib_colour)
    steel = mat('container_corner', (58, 58, 62))
    L, W, H = 6.06, 2.44, 2.59
    bits = [cube(body, (L, W, H), loc=(0, 0, H / 2))]
    for i in range(1, 30):
        x = -L / 2 + i * L / 30
        for y in (-W / 2 - 0.015, W / 2 + 0.015):
            bits.append(cube(rib, (0.07, 0.03, H - 0.3), loc=(x, y, H / 2)))
    for x in (-L / 2 + 0.06, L / 2 - 0.06):
        for y in (-W / 2 + 0.06, W / 2 - 0.06):
            bits.append(cube(steel, (0.18, 0.18, H + 0.02), loc=(x, y, H / 2)))
    for z in (0.08, H - 0.08):
        for y in (-W / 2, W / 2):
            bits.append(cube(steel, (L, 0.06, 0.16), loc=(0, y, z)))
    # Door end: two doors, four locking bars.
    for k in range(4):
        y = -W / 2 + 0.35 + k * (W - 0.7) / 3
        bits.append(cyl(steel, 0.03, H - 0.4, loc=(L / 2 + 0.04, y, H / 2), verts=6))
    bits.append(cube(steel, (0.04, 0.04, H - 0.3), loc=(L / 2 + 0.03, 0, H / 2)))
    return join(name, bits)


def build_docks(out):
    wood = mat('crate_wood', (196, 150, 92))
    wood_dk = mat('crate_wood_dark', (150, 108, 62))
    drum_b = mat('drum_blue', (40, 100, 170))
    drum_r = mat('drum_red', (200, 60, 40))
    steel = mat('dock_steel', (150, 156, 164))
    iron = mat('iron', (68, 68, 72))
    bollard_m = mat('bollard', (40, 44, 48))
    yellow = mat('safety_yellow', (242, 196, 40))
    rope = mat('rope', (214, 186, 130))
    net_m = mat('net', (60, 110, 90))
    float_m = mat('float', (240, 120, 30))
    white = mat('white', (245, 245, 245))
    red = mat('buoy_red', (220, 50, 40))
    gull_grey = mat('gull_grey', (150, 156, 166))
    beak = mat('beak', (250, 180, 40))
    black = mat('black', (30, 30, 34))
    glow = mat('lamp_light', (255, 243, 176))

    out.append(container_prop('container', (200, 68, 42), (176, 54, 32)))
    out.append(container_prop('container2', (42, 106, 176), (32, 86, 150)))
    out.append(container_prop('container3', (58, 138, 74), (44, 112, 58)))

    # Wooden crate with planks and corner battens.
    cr = [cube(wood, (1.0, 1.0, 1.0), loc=(0, 0, 0.5))]
    for x in (-0.48, 0.48):
        for y in (-0.48, 0.48):
            cr.append(cube(wood_dk, (0.1, 0.1, 1.02), loc=(x, y, 0.5)))
    for y in (-0.51, 0.51):
        cr.append(cube(wood_dk, (1.0, 0.03, 0.1), loc=(0, y, 0.5), rot=(0, 0.78, 0)))
    out.append(join('crate', cr))

    # Oil drums, a blue one and a red one leaning.
    out.append(join('barrel', [
        cyl(drum_b, 0.3, 0.9, loc=(0, 0, 0.45), verts=18),
        cyl(drum_b, 0.31, 0.04, loc=(0, 0, 0.3), verts=18), cyl(drum_b, 0.31, 0.04, loc=(0, 0, 0.6), verts=18),
        cyl(drum_r, 0.3, 0.9, loc=(0.68, 0.1, 0.45), verts=18),
        cyl(iron, 0.31, 0.03, loc=(0.68, 0.1, 0.9), verts=18),
    ]))

    # A stack of pallets.
    pl = []
    for k in range(4):
        z = k * 0.15
        for x in (-0.5, 0, 0.5):
            pl.append(cube(wood_dk, (0.1, 1.0, 0.08), loc=(x, 0, z + 0.04)))
        for i in range(6):
            pl.append(cube(wood, (1.2, 0.13, 0.025), loc=(0, -0.42 + i * 0.17, z + 0.1)))
    out.append(join('pallets', pl))

    # A coil of rope on the quay.
    rc = []
    for k in range(4):
        bpy.ops.mesh.primitive_torus_add(major_radius=0.42 - k * 0.04, minor_radius=0.055, location=(0, 0, 0.06 + k * 0.1), major_segments=24, minor_segments=8)
        rc.append(finish(bpy.context.object, rope, True))
    out.append(join('ropecoil', rc))

    # Lobster pots stacked up, with a float.
    lp = []
    for i, (x, z) in enumerate([(-0.4, 0.25), (0.4, 0.25), (0, 0.75)]):
        lp.append(cube(net_m, (0.75, 0.55, 0.45), loc=(x, 0, z - 0.02)))
        for k in range(3):
            lp.append(cyl(wood_dk, 0.02, 0.56, loc=(x - 0.3 + k * 0.3, 0, z + 0.2), rot=(math.pi / 2, 0, 0), verts=6))
    lp.append(sphere(float_m, 0.17, loc=(0.75, 0.25, 0.17), segs=12, rings=8))
    out.append(join('lobsterpots', lp))

    # A heap of fishing net with orange floats.
    nt = [ico(net_m, 0.7, loc=(0, 0, 0.2), scale=(1.4, 1, 0.45), sub=2, jitter=0.25, seed=33, smooth=True)]
    for k in range(6):
        a = k * 1.1
        nt.append(sphere(float_m, 0.1, loc=(0.8 * math.cos(a), 0.55 * math.sin(a), 0.33), segs=10, rings=6))
    out.append(join('net', nt))

    # A little yellow forklift.
    fk = [cube(yellow, (1.6, 1.0, 0.7), loc=(-0.1, 0, 0.6), bevel=0.05),
          cube(black, (1.0, 1.0, 0.07), loc=(-0.25, 0, 2.12), bevel=0.02),
          cyl(black, 0.12, 0.03, loc=(0.0, 0, 1.25), rot=(0, 0.6, 0), verts=12),
          cyl(black, 0.02, 0.35, loc=(-0.05, 0, 1.08), rot=(0, 0.6, 0), verts=6),
          cube(black, (0.25, 0.9, 0.4), loc=(-0.75, 0, 1.05))]
    for x in (-0.8, 0.0):
        for y in (-0.45, 0.45):
            fk.append(cyl(black, 0.25, 0.2, loc=(x + 0.3, y, 0.25), rot=(math.pi / 2, 0, 0), verts=14))
    for y in (-0.45, 0.45):
        # Roll cage posts from the body up to the roof.
        fk.append(cube(black, (0.07, 0.07, 1.2), loc=(-0.68, y, 1.53)))
        fk.append(cube(black, (0.07, 0.07, 1.2), loc=(0.18, y, 1.53)))
        fk.append(cube(iron, (0.1, 0.12, 2.2), loc=(0.75, y * 0.6, 1.1)))
        fk.append(cube(iron, (0.9, 0.12, 0.05), loc=(1.2, y * 0.6, 0.06)))
    out.append(join('forklift', fk))

    # An old anchor on the quay.
    an = [cyl(iron, 0.08, 2.0, loc=(0, 0, 1.0), verts=10)]
    bpy.ops.mesh.primitive_torus_add(major_radius=0.8, minor_radius=0.09, location=(0, 0, 1.0), rotation=(math.pi / 2, 0, 0), major_segments=24, minor_segments=8)
    ring = bpy.context.object
    bm = bmesh.new()
    bm.from_mesh(ring.data)
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.co.y > 0.0], context='VERTS')
    bm.to_mesh(ring.data)
    bm.free()
    an.append(finish(ring, iron, True))
    for sx in (-1, 1):
        an.append(cyl(iron, 0.14, 0.4, loc=(sx * 0.8, 0, 1.15), rot=(0, sx * 0.4, 0), r2=0.0, verts=8))
    an.append(cyl(iron, 0.06, 1.2, loc=(0, 0, 1.8), rot=(0, math.pi / 2, 0), verts=8))
    bpy.ops.mesh.primitive_torus_add(major_radius=0.18, minor_radius=0.05, location=(0, 0, 2.15), rotation=(math.pi / 2, 0, 0), major_segments=16, minor_segments=6)
    an.append(finish(bpy.context.object, iron, True))
    out.append(join('anchor', an))

    # A gull standing about.
    out.append(join('gull', [
        sphere(white, 0.16, loc=(0, 0, 0.3), scale=(1.5, 0.9, 0.9), segs=12, rings=8),
        sphere(white, 0.09, loc=(0.2, 0, 0.43), segs=10, rings=6),
        cyl(beak, 0.025, 0.12, loc=(0.32, 0, 0.42), rot=(0, math.pi / 2, 0), r2=0.005, verts=6),
        sphere(gull_grey, 0.15, loc=(-0.04, 0, 0.35), scale=(1.5, 1.0, 0.5), segs=12, rings=6),
        sphere(black, 0.06, loc=(-0.25, 0, 0.33), scale=(1.4, 0.8, 0.5), segs=8, rings=6),
        cyl(beak, 0.012, 0.18, loc=(0.03, 0.05, 0.09), verts=5), cyl(beak, 0.012, 0.18, loc=(0.03, -0.05, 0.09), verts=5),
    ]))

    # A lifebuoy on its post.
    lb = [cyl(wood_dk, 0.06, 1.6, loc=(0, 0, 0.8), verts=8), cube(wood_dk, (0.1, 0.4, 0.6), loc=(0, 0.0, 1.25))]
    bpy.ops.mesh.primitive_torus_add(major_radius=0.32, minor_radius=0.09, location=(0, -0.3, 1.25), rotation=(math.pi / 2, 0, 0), major_segments=24, minor_segments=8)
    ring = bpy.context.object
    ring.data.materials.append(white)
    ring.data.materials.append(red)
    for p in ring.data.polygons:
        a = math.atan2(p.center.z - 1.25, p.center.x)
        p.material_index = 1 if int((a + math.pi) / (math.pi / 2)) % 2 else 0
        p.use_smooth = True
    lb.append(ring)
    out.append(join('lifebuoy', lb))

    # Quay edge rail: one 2.4 m bay, a post on the left and a hanging chain.
    ch = [cyl(yellow, 0.05, 1.0, loc=(-1.2, 0, 0.5), verts=10), sphere(yellow, 0.07, loc=(-1.2, 0, 1.02), segs=10, rings=6)]
    for i in range(20):
        t = (i + 0.5) / 20
        x = -1.2 + t * 2.4
        z = 0.9 - 0.25 * math.sin(math.pi * t)
        bpy.ops.mesh.primitive_torus_add(major_radius=0.07, minor_radius=0.02, location=(x, 0, z), rotation=(0, 0, 0) if i % 2 else (math.pi / 2, 0, 0), major_segments=10, minor_segments=4)
        ch.append(finish(bpy.context.object, iron, True))
    out.append(join('chainrail', ch))

    # Tall floodlight post with a lamp head facing the track (+Y is towards the camera in game? lamps face -Y).
    out.append(join('docklamp', [
        cyl(steel, 0.12, 5.0, loc=(0, 0, 2.5), r2=0.08, verts=10),
        cube(steel, (0.2, 0.7, 0.08), loc=(0, -0.3, 4.95)),
        cube(iron, (0.6, 0.3, 0.35), loc=(0, -0.55, 4.9), bevel=0.04),
        cube(glow, (0.5, 0.05, 0.25), loc=(0, -0.71, 4.88)),
    ]))

    # A mooring bollard.
    out.append(join('bollard', [
        cyl(bollard_m, 0.24, 0.12, loc=(0, 0, 0.06), verts=14),
        cyl(bollard_m, 0.17, 0.55, loc=(0, 0, 0.38), r2=0.14, verts=14),
        cyl(bollard_m, 0.24, 0.1, loc=(0, 0, 0.68), verts=14),
        cyl(yellow, 0.172, 0.08, loc=(0, 0, 0.3), verts=14),
    ]))


def build_pirate(out):
    iron = mat('iron', (68, 68, 72))
    wood = mat('crate_wood', (196, 150, 92))
    wood_dk = mat('crate_wood_dark', (150, 108, 62))
    carriage = mat('cannon_wood', (120, 70, 36))
    gold = mat('gold', (250, 200, 40))
    chest_m = mat('chest_wood', (140, 80, 40))
    gem_r = mat('gem_red', (220, 30, 60))
    gem_b = mat('gem_blue', (40, 120, 230))
    shell_m = mat('shell', (250, 214, 196))
    shell_dk = mat('shell_dark', (230, 160, 140))
    flag = mat('pirate_flag', (24, 24, 28))
    white = mat('white', (245, 245, 245))
    red = mat('parrot_red', (220, 40, 40))
    blue = mat('parrot_blue', (40, 110, 220))
    yellow = mat('parrot_yellow', (250, 200, 40))
    beak = mat('parrot_beak', (40, 40, 44))

    # A ship's cannon on a wooden carriage, pointing out to sea (-Y is towards the camera, so +Y).
    cn = [cube(carriage, (0.8, 1.1, 0.35), loc=(0, 0, 0.42), bevel=0.03)]
    for x in (-0.42, 0.42):
        for y in (-0.38, 0.38):
            cn.append(cyl(carriage, 0.18, 0.08, loc=(x, y, 0.18), rot=(0, math.pi / 2, 0), verts=12))
    cn.append(cyl(iron, 0.2, 1.5, loc=(0, 0.25, 0.75), rot=(math.radians(80), 0, 0), r2=0.15, verts=16))
    cn.append(sphere(iron, 0.17, loc=(0, -0.48, 0.66), segs=12, rings=8))
    cn.append(cyl(iron, 0.19, 0.08, loc=(0, 0.97, 0.88), rot=(math.radians(80), 0, 0), verts=16))
    out.append(join('cannon', cn))

    out.append(join('cannonballs', [sphere(iron, 0.15, loc=(x, y, z), segs=10, rings=8) for x, y, z in
        [(-0.15, -0.09, 0.15), (0.15, -0.09, 0.15), (0, 0.17, 0.15), (0, 0.0, 0.39)]]))

    # A treasure chest, lid open, spilling gold.
    ch = [cube(chest_m, (0.9, 0.55, 0.45), loc=(0, 0, 0.225), bevel=0.02)]
    for x in (-0.35, 0.35):
        ch.append(cube(gold, (0.06, 0.57, 0.47), loc=(x, 0, 0.225)))
    lid = cyl(chest_m, 0.28, 0.9, loc=(0, 0.3, 0.6), rot=(0, math.pi / 2, 0), verts=16)
    ch.append(lid)
    ch.append(ico(gold, 0.36, loc=(0, 0, 0.42), scale=(1.1, 0.65, 0.3), sub=2, jitter=0.3, seed=7))
    for i in range(8):
        a = i * 0.8
        ch.append(cyl(gold, 0.06, 0.015, loc=(0.6 * math.cos(a), -0.4 + 0.1 * math.sin(a), 0.01), verts=10))
    ch.append(ico(gem_r, 0.07, loc=(0.15, -0.05, 0.52), sub=1))
    ch.append(ico(gem_b, 0.06, loc=(-0.18, 0.05, 0.5), sub=1))
    out.append(join('chest', ch))

    # A scallop shell lying on the sand.
    sh = [sphere(shell_m, 0.22, loc=(0, 0, 0.0), scale=(1, 0.9, 0.35), segs=16, rings=8)]
    for k in range(7):
        a = math.pi * (k + 0.5) / 7
        sh.append(cube(shell_dk, (0.02, 0.2, 0.03), loc=(0.11 * math.cos(a), 0.1 * math.sin(a) - 0.05, 0.07), rot=(0, 0, a - math.pi / 2)))
    sh.append(cube(shell_m, (0.12, 0.08, 0.05), loc=(0, -0.2, 0.03)))
    out.append(join('shell', sh))

    # A parrot on a perch.
    out.append(join('parrot', [
        cyl(wood_dk, 0.04, 1.4, loc=(0, 0, 0.7), verts=8),
        cyl(wood_dk, 0.03, 0.6, loc=(0, 0, 1.4), rot=(0, math.pi / 2, 0), verts=8),
        sphere(red, 0.12, loc=(0, 0, 1.6), scale=(0.9, 0.9, 1.4), segs=12, rings=8),
        sphere(red, 0.09, loc=(0, -0.04, 1.8), segs=10, rings=8),
        cyl(beak, 0.04, 0.08, loc=(0, -0.12, 1.79), rot=(math.pi / 2, 0, 0), r2=0.005, verts=6),
        sphere(white, 0.03, loc=(0.05, -0.09, 1.83), segs=6, rings=4),
        sphere(blue, 0.09, loc=(0.09, 0.02, 1.58), scale=(0.4, 0.9, 1.4), segs=10, rings=6),
        sphere(blue, 0.09, loc=(-0.09, 0.02, 1.58), scale=(0.4, 0.9, 1.4), segs=10, rings=6),
        cube(yellow, (0.06, 0.04, 0.3), loc=(0, 0.06, 1.38), rot=(0.4, 0, 0)),
    ]))

    # A flagpole flying the skull and crossbones.
    fl = [cyl(wood_dk, 0.06, 5.0, loc=(0, 0, 2.5), verts=8), sphere(gold, 0.09, loc=(0, 0, 5.05), segs=8, rings=6),
          cube(flag, (1.4, 0.03, 0.9), loc=(0.72, 0, 4.4))]
    fl.append(sphere(white, 0.17, loc=(0.72, -0.03, 4.5), scale=(1, 0.3, 1), segs=12, rings=8))
    fl.append(cube(white, (0.18, 0.04, 0.1), loc=(0.72, -0.03, 4.32)))
    for a in (0.6, -0.6):
        fl.append(cube(white, (0.6, 0.04, 0.06), loc=(0.72, -0.03, 4.15), rot=(0, a, 0)))
    fl.append(sphere(flag, 0.04, loc=(0.66, -0.07, 4.5), segs=6, rings=4))
    fl.append(sphere(flag, 0.04, loc=(0.78, -0.07, 4.5), segs=6, rings=4))
    out.append(join('jollyflag', fl))


def limb(material, p0, p1, r0, r1, verts=8):
    """A tapered branch from p0 to p1."""
    dx, dy, dz = (p1[i] - p0[i] for i in range(3))
    d = math.sqrt(dx * dx + dy * dy + dz * dz)
    o = cyl(material, r0, d, loc=tuple((p0[i] + p1[i]) / 2 for i in range(3)), r2=r1, verts=verts)
    # Point the cone's +Z along the branch.
    o.rotation_euler = (math.acos(max(-1, min(1, dz / d))) * 1, 0, 0)
    o.rotation_mode = 'XYZ'
    yaw = math.atan2(dy, dx) + math.pi / 2
    o.rotation_euler = (0, 0, 0)
    import mathutils
    v = mathutils.Vector((dx, dy, dz)).normalized()
    o.rotation_mode = 'QUATERNION'
    o.rotation_quaternion = mathutils.Vector((0, 0, 1)).rotation_difference(v)
    apply_tf(o)
    return o


def build_haunted(out):
    bark = mat('dead_bark', (120, 104, 108))
    bark_dk = mat('dead_bark_dark', (92, 78, 86))
    stone = mat('grave_stone', (150, 150, 160))
    stone_dk = mat('grave_stone_dark', (112, 112, 124))
    moss = mat('moss', (90, 120, 70))
    pumpkin_m = mat('pumpkin', (242, 128, 32))
    pumpkin_dk = mat('pumpkin_dark', (214, 98, 22))
    stem = mat('stem', (96, 120, 50))
    face = mat('pumpkin_glow', (255, 200, 60))
    sheet = mat('ghost_sheet', (240, 244, 255))
    black = mat('ghost_eye', (30, 26, 40))
    iron = mat('iron', (68, 68, 72))
    goo = mat('goo_glow', (120, 240, 80))
    glow = mat('lamp_light', (255, 243, 176))
    log = mat('crate_wood_dark', (150, 108, 62))

    # A bare, twisted dead tree: a leaning trunk forking into crooked branches.
    import random
    rnd = random.Random(13)
    tr = [limb(bark, (0, 0, 0), (0.35, 0, 1.6), 0.45, 0.3, verts=10), limb(bark, (0.35, 0, 1.6), (0.1, 0.05, 2.9), 0.3, 0.18, verts=10),
          limb(bark, (0.1, 0.05, 2.9), (0.3, 0, 3.8), 0.18, 0.08, verts=8)]
    for a in range(5):
        ang = a * 2 * math.pi / 5 + 0.3
        tr.append(limb(bark_dk, (0, 0, 0.25), (0.75 * math.cos(ang), 0.5 * math.sin(ang), -0.05), 0.16, 0.05, verts=6))
    for base, ang, ln in [((0.35, 0, 1.6), 0.5, 1.9), ((0.25, 0, 2.1), 2.7, 1.8), ((0.1, 0.05, 2.9), 0.9, 1.4), ((0.15, 0.05, 2.6), 3.3, 1.5), ((0.3, 0, 3.8), 1.8, 0.9)]:
        mid = (base[0] + ln * 0.5 * math.cos(ang), base[1] + 0.25 * math.sin(ang), base[2] + ln * 0.15)
        tip = (base[0] + ln * math.cos(ang), base[1] + 0.4 * math.sin(ang), base[2] + ln * 0.6)
        tr.append(limb(bark, base, mid, 0.15, 0.1, verts=7))
        tr.append(limb(bark, mid, tip, 0.1, 0.05, verts=6))
        for k in range(2):
            a2 = ang + (rnd.random() - 0.5) * 1.8
            t2 = (tip[0] + 0.7 * math.cos(a2), tip[1] + 0.2 * math.sin(a2), tip[2] + 0.1 + rnd.random() * 0.5)
            tr.append(limb(bark_dk, tip, t2, 0.05, 0.02, verts=5))
    # A hollow in the trunk, like a spooky face.
    tr.append(sphere(black, 0.12, loc=(0.25, -0.38, 1.5), scale=(0.8, 0.4, 1.3), segs=10, rings=8))
    out.append(join('spookytree', tr))

    # A gravestone with a rounded top and a mossy foot, leaning a little.
    gs = [cube(stone, (0.7, 0.18, 0.75), loc=(0, 0, 0.42), bevel=0.03), cyl(stone, 0.35, 0.18, loc=(0, 0, 0.8), rot=(math.pi / 2, 0, 0), verts=20),
          cube(stone_dk, (0.4, 0.02, 0.05), loc=(0, -0.1, 0.75)), cube(stone_dk, (0.3, 0.02, 0.05), loc=(0, -0.1, 0.6)),
          cube(stone_dk, (0.35, 0.02, 0.05), loc=(0, -0.1, 0.45)),
          sphere(moss, 0.4, loc=(0, 0, 0.02), scale=(1.2, 0.8, 0.25), segs=10, rings=6)]
    o = join('gravestone', gs)
    o.rotation_euler = (0.08, 0.06, 0)
    out.append(o)

    # A stone cross.
    out.append(join('gravecross', [cube(stone, (0.18, 0.16, 1.3), loc=(0, 0, 0.65), bevel=0.02), cube(stone, (0.7, 0.16, 0.18), loc=(0, 0, 0.95), bevel=0.02),
                                   cube(stone_dk, (0.4, 0.3, 0.12), loc=(0, 0, 0.06), bevel=0.02), sphere(moss, 0.3, loc=(0, 0, 0.02), scale=(1.2, 1, 0.25), segs=10, rings=6)]))

    # A jack-o'-lantern grinning at the track, lit from inside.
    pk = []
    for k in range(8):
        a = k * math.pi / 4
        pk.append(sphere(pumpkin_m if k % 2 else pumpkin_dk, 0.22, loc=(0.15 * math.cos(a), 0.15 * math.sin(a), 0.27), scale=(1, 0.75, 1.1), segs=14, rings=10))
    pk.append(sphere(pumpkin_m, 0.27, loc=(0, 0, 0.28), segs=16, rings=10))
    pk.append(cyl(stem, 0.04, 0.16, loc=(0.02, 0, 0.6), rot=(0, 0.3, 0), verts=6))
    for x in (-0.12, 0.12):
        pk.append(cyl(face, 0.07, 0.06, loc=(x, -0.36, 0.36), rot=(math.pi / 2, 0, math.pi / 2), verts=3))
    pk.append(cyl(face, 0.04, 0.06, loc=(0, -0.38, 0.27), rot=(math.pi / 2, 0, -math.pi / 2), verts=3))
    pk.append(cube(face, (0.32, 0.06, 0.07), loc=(0, -0.36, 0.17)))
    for x in (-0.08, 0.08):
        pk.append(cube(pumpkin_m, (0.05, 0.07, 0.04), loc=(x, -0.37, 0.19)))
    out.append(join('jackolantern', pk))

    # A friendly cartoon ghost: a floating sheet with a wavy hem, big eyes and an "oooh" mouth.
    gh = [sphere(sheet, 0.42, loc=(0, 0, 1.55), segs=18, rings=12), cyl(sheet, 0.42, 1.0, loc=(0, 0, 1.05), r2=0.6, verts=18)]
    gh[1].rotation_euler = (math.pi, 0, 0)
    apply_tf(gh[1])
    for k in range(9):
        a = 2 * math.pi * k / 9
        gh.append(sphere(sheet, 0.16, loc=(0.52 * math.cos(a), 0.52 * math.sin(a), 0.57), segs=10, rings=6))
    for x in (-0.15, 0.15):
        gh.append(sphere(black, 0.08, loc=(x, -0.37, 1.62), scale=(0.8, 0.5, 1.2), segs=10, rings=8))
    gh.append(sphere(black, 0.07, loc=(0, -0.4, 1.4), scale=(0.8, 0.5, 1.1), segs=10, rings=8))
    for s in (-1, 1):
        gh.append(sphere(sheet, 0.13, loc=(s * 0.5, -0.05, 1.2), scale=(1.4, 0.8, 0.8), segs=10, rings=8))
    out.append(join('ghost', gh))

    # A witch's cauldron bubbling green over a log fire.
    cd = [sphere(iron, 0.5, loc=(0, 0, 0.6), scale=(1, 1, 0.8), segs=18, rings=10), cyl(iron, 0.44, 0.06, loc=(0, 0, 0.98), verts=18),
          cyl(goo, 0.4, 0.04, loc=(0, 0, 0.97), verts=18)]
    for k in range(3):
        a = k * 2 * math.pi / 3
        cd.append(cyl(iron, 0.05, 0.4, loc=(0.35 * math.cos(a), 0.35 * math.sin(a), 0.18), verts=6))
        cd.append(cyl(log, 0.07, 0.8, loc=(0.1 * math.cos(a), 0.1 * math.sin(a), 0.07), rot=(math.pi / 2, 0, a), verts=8))
    for x, y in ((0.1, 0.05), (-0.15, -0.1), (0.05, -0.18)):
        cd.append(sphere(goo, 0.08, loc=(x, y, 1.02), segs=8, rings=6))
    out.append(join('cauldron', cd))

    # Iron railings: a 2.4 m run of spiked bars between two posts.
    fe = [cube(iron, (0.1, 0.1, 1.5), loc=(-1.2, 0, 0.75)), sphere(iron, 0.08, loc=(-1.2, 0, 1.55), segs=8, rings=6),
          cube(iron, (2.4, 0.04, 0.05), loc=(0, 0, 1.15)), cube(iron, (2.4, 0.04, 0.05), loc=(0, 0, 0.3))]
    for k in range(8):
        x = -1.2 + 0.3 * (k + 0.5)
        fe.append(cyl(iron, 0.02, 1.25, loc=(x, 0, 0.67), verts=6))
        fe.append(cyl(iron, 0.04, 0.12, loc=(x, 0, 1.36), r2=0.0, verts=4))
    out.append(join('ironfence', fe))

    # A crooked old gas lamp, the lantern facing the track.
    out.append(join('gaslamp', [
        limb(iron, (0, 0, 0), (0.08, 0, 1.6), 0.08, 0.06), limb(iron, (0.08, 0, 1.6), (-0.05, 0, 3.0), 0.06, 0.05),
        cyl(iron, 0.16, 0.2, loc=(0, 0, 0.1), verts=10),
        cube(iron, (0.04, 0.5, 0.04), loc=(-0.05, -0.22, 3.0)),
        cube(glow, (0.24, 0.24, 0.32), loc=(-0.05, -0.45, 2.8)),
        cyl(iron, 0.2, 0.16, loc=(-0.05, -0.45, 3.04), r2=0.04, verts=4, rot=(0, 0, math.pi / 4)),
        cube(iron, (0.28, 0.28, 0.04), loc=(-0.05, -0.45, 2.62)),
    ]))

    # A crow perched on a broken post.
    out.append(join('crow', [
        cyl(log, 0.09, 1.1, loc=(0, 0, 0.55), verts=8),
        sphere(black, 0.13, loc=(0, 0, 1.22), scale=(1.4, 0.8, 0.9), segs=10, rings=8),
        sphere(black, 0.08, loc=(0.15, 0, 1.33), segs=8, rings=6),
        cyl(face, 0.03, 0.1, loc=(0.25, 0, 1.33), rot=(0, math.pi / 2, 0), r2=0.0, verts=6),
        cube(black, (0.2, 0.05, 0.04), loc=(-0.2, 0, 1.24), rot=(0, -0.3, 0)),
    ]))


def build_funfair(out):
    red = mat('red', (230, 60, 50))
    white = mat('white', (245, 245, 245))
    yellow = mat('yellow', (255, 206, 60))
    blue = mat('fair_blue', (50, 110, 220))
    green = mat('fair_green', (60, 180, 90))
    pink = mat('floss_pink', (255, 150, 200))
    wood = mat('crate_wood', (196, 150, 92))
    wood_dk = mat('crate_wood_dark', (150, 108, 62))
    iron = mat('iron', (68, 68, 72))
    bulb = mat('lamp_light', (255, 243, 176))
    gold = mat('gold', (250, 200, 40))
    fur = mat('teddy_fur', (190, 130, 70))
    fur_lt = mat('teddy_fur_light', (230, 190, 140))
    eye = mat('ghost_eye', (30, 26, 40))
    corn = mat('popcorn', (255, 240, 200))

    # A striped fairground tent with a pennant on top and the door flaps tied back.
    tent = [striped_cone([red, white], 2.0, 1.6, loc=(0, 0, 0.8), verts=16, r2=2.0),
            striped_cone([red, white], 2.15, 1.6, loc=(0, 0, 2.4), verts=16, r2=0.06),
            cyl(wood_dk, 0.04, 0.8, loc=(0, 0, 3.5), verts=6), cube(yellow, (0.4, 0.02, 0.24), loc=(0.2, 0, 3.75)),
            cube(eye, (0.9, 0.05, 1.3), loc=(0, -1.98, 0.65))]
    for x in (-0.55, 0.55):
        tent.append(cube(red, (0.35, 0.06, 1.4), loc=(x, -2.0, 0.75), rot=(0, x * 0.4, 0)))
    for k in range(16):
        a = 2 * math.pi * (k + 0.5) / 16
        tent.append(sphere(yellow if k % 2 else blue, 0.12, loc=(2.12 * math.cos(a), 2.12 * math.sin(a), 1.55), scale=(1, 1, 1.3), segs=8, rings=6))
    out.append(join('tent', tent))

    # A candyfloss stand: a little striped cart with a fluffy pink cloud on a stick.
    cf = [cube(white, (1.4, 0.8, 0.9), loc=(0, 0, 0.75), bevel=0.03), cube(pink, (1.42, 0.82, 0.15), loc=(0, 0, 0.5)),
          cyl(iron, 0.22, 0.1, loc=(-0.45, -0.42, 0.3), rot=(math.pi / 2, 0, 0), verts=12), cyl(iron, 0.22, 0.1, loc=(0.45, -0.42, 0.3), rot=(math.pi / 2, 0, 0), verts=12)]
    for x in (-0.6, 0.6):
        cf.append(cyl(white, 0.03, 1.2, loc=(x, 0.3, 1.8), verts=6))
    cf.append(striped_cone([pink, white], 0.95, 0.4, loc=(0, 0, 2.5), verts=12, r2=0.1))
    cf.append(sphere(pink, 0.32, loc=(0.3, -0.2, 1.65), scale=(1, 1, 0.85), segs=12, rings=8))
    cf.append(cyl(white, 0.015, 0.4, loc=(0.3, -0.2, 1.3), verts=5))
    cf.append(sphere(pink, 0.25, loc=(-0.3, -0.1, 1.55), segs=12, rings=8))
    out.append(join('candyfloss', cf))

    # A bunch of balloons tied to a weight.
    bl = [cyl(iron, 0.1, 0.1, loc=(0, 0, 0.05), verts=8)]
    for k, (m, x, y, z) in enumerate([(red, 0, 0, 2.2), (yellow, 0.3, 0.1, 2.0), (blue, -0.3, 0.05, 2.05), (green, 0.1, -0.2, 2.45), (pink, -0.15, 0.2, 2.5)]):
        bl.append(sphere(m, 0.22, loc=(x, y, z), scale=(1, 1, 1.2), segs=12, rings=8))
        bl.append(limb(white, (0, 0, 0.1), (x, y, z - 0.26), 0.008, 0.008, verts=4))
    out.append(join('balloons', bl))

    # A popcorn cart: red and white with a glass box full of popcorn and big wheels.
    pc = [cube(red, (1.1, 0.7, 0.7), loc=(0, 0, 0.75), bevel=0.03), cube(white, (1.12, 0.72, 0.1), loc=(0, 0, 0.9)),
          cube(corn, (0.9, 0.55, 0.45), loc=(0, 0, 1.33)), cube(yellow, (1.1, 0.7, 0.08), loc=(0, 0, 1.6)),
          striped_cone([red, white], 0.75, 0.3, loc=(0, 0, 1.8), verts=12, r2=0.05)]
    for x in (-0.5, 0.5):
        pc.append(cyl(iron, 0.22, 0.06, loc=(x, -0.38, 0.22), rot=(math.pi / 2, 0, 0), verts=14))
        for y in (-0.33, 0.33):
            pc.append(cyl(yellow, 0.02, 0.45, loc=(x, y, 1.35), verts=5))
    out.append(join('popcorn', pc))

    # A giant prize teddy bear sitting up.
    td = [sphere(fur, 0.45, loc=(0, 0, 0.5), scale=(1, 0.9, 1.1), segs=14, rings=10), sphere(fur_lt, 0.3, loc=(0, -0.25, 0.48), scale=(1, 0.5, 1.1), segs=12, rings=8),
          sphere(fur, 0.33, loc=(0, 0, 1.15), segs=14, rings=10), sphere(fur_lt, 0.13, loc=(0, -0.28, 1.08), scale=(1, 0.7, 0.8), segs=10, rings=8),
          sphere(eye, 0.05, loc=(0, -0.38, 1.12), segs=8, rings=6), cube(red, (0.3, 0.06, 0.08), loc=(0, -0.24, 0.85))]
    for x in (-0.24, 0.24):
        td.append(sphere(fur, 0.11, loc=(x, 0, 1.43), scale=(1, 0.6, 1), segs=10, rings=6))
        td.append(sphere(eye, 0.04, loc=(x * 0.5, -0.3, 1.22), segs=8, rings=6))
        td.append(sphere(fur, 0.15, loc=(x * 1.6, -0.15, 0.6), scale=(1, 1, 1.6), segs=10, rings=6))
        td.append(sphere(fur, 0.16, loc=(x, -0.35, 0.15), scale=(1, 1.5, 0.9), segs=10, rings=6))
    out.append(join('teddy', td))

    # Bunting: a post with a rope of little triangle flags to the next post 2.4 m along.
    bt = [cyl(white, 0.05, 1.8, loc=(-1.2, 0, 0.9), verts=8), sphere(red, 0.08, loc=(-1.2, 0, 1.82), segs=8, rings=6)]
    pts = [(-1.2 + 2.4 * i / 8, 1.7 - 0.25 * math.sin(math.pi * i / 8)) for i in range(9)]
    for (x0, z0), (x1, z1) in zip(pts, pts[1:]):
        d = math.hypot(x1 - x0, z1 - z0)
        bt.append(cyl(white, 0.012, d * 1.05, loc=((x0 + x1) / 2, 0, (z0 + z1) / 2), rot=(0, math.atan2(x1 - x0, z1 - z0), 0), verts=4))
    for i, (x, z) in enumerate(pts[:-1]):
        x += 0.15
        bt.append(cyl([red, yellow, blue, green][i % 4], 0.2, 0.02, loc=(x, 0, z - 0.24), rot=(math.pi / 2, 0, math.pi / 2), verts=3))
    out.append(join('bunting', bt))

    # A fairground lamp post: striped pole with a ring of bulbs and a star on top.
    fl = [cyl(white, 0.08, 3.6, loc=(0, 0, 1.8), verts=10), cyl(red, 0.2, 0.2, loc=(0, 0, 0.1), verts=10)]
    for z in (0.8, 1.6, 2.4):
        fl.append(cyl(red, 0.085, 0.3, loc=(0, 0, z), verts=10))
    fl.append(cyl(gold, 0.5, 0.06, loc=(0, 0, 3.4), verts=16))
    for k in range(10):
        a = 2 * math.pi * k / 10
        fl.append(sphere(bulb, 0.07, loc=(0.5 * math.cos(a), 0.5 * math.sin(a), 3.33), segs=8, rings=6))
    fl.append(sphere(bulb, 0.18, loc=(0, 0, 3.75), segs=10, rings=8))
    out.append(join('fairlamp', fl))

    # A single balloon on a string, tied to a peg at the track's edge.
    out.append(join('balloon', [cyl(wood_dk, 0.03, 0.2, loc=(0, 0, 0.1), verts=6), limb(white, (0, 0, 0.18), (0.1, 0, 1.25), 0.008, 0.008, verts=4),
                                sphere(red, 0.2, loc=(0.1, 0, 1.47), scale=(1, 1, 1.2), segs=12, rings=8), cyl(red, 0.04, 0.06, loc=(0.1, 0, 1.24), r2=0.0, verts=6)]))


def build_toxic(out):
    yellow = mat('hazard_yellow', (250, 200, 30))
    black = mat('hazard_black', (34, 34, 38))
    goo = mat('goo_glow', (120, 240, 80))
    steel = mat('steel', (160, 168, 176))
    steel_dk = mat('steel_dark', (96, 102, 110))
    pipe_m = mat('pipe_green', (70, 130, 110))
    pipe_r = mat('pipe_red', (190, 70, 50))
    amber = mat('lamp_light', (255, 243, 176))
    white = mat('white', (245, 245, 245))

    def barrel(x, y, z, lean=0.0):
        parts = [cyl(yellow, 0.32, 0.95, loc=(x, y, z + 0.475), verts=16)]
        for dz in (0.2, 0.75):
            parts.append(cyl(black, 0.325, 0.12, loc=(x, y, z + dz), verts=16))
        parts.append(cyl(steel_dk, 0.3, 0.03, loc=(x, y, z + 0.96), verts=16))
        return parts

    # A leaky barrel of goo with a dribble down its side and a puddle round its foot.
    tb = barrel(0, 0, 0) + [sphere(goo, 0.1, loc=(0.1, -0.05, 0.98), scale=(1.4, 1, 0.5), segs=10, rings=6),
                            cyl(goo, 0.04, 0.6, loc=(0.2, -0.24, 0.66), verts=8), sphere(goo, 0.06, loc=(0.2, -0.25, 0.35), segs=8, rings=6),
                            sphere(goo, 0.45, loc=(0.25, -0.35, 0.0), scale=(1.2, 0.8, 0.05), segs=14, rings=6)]
    out.append(join('toxicbarrel', tb))

    # A stack of barrels: three on the bottom, two on top.
    st = []
    for x in (-0.66, 0, 0.66):
        st += barrel(x, 0, 0)
    for x in (-0.33, 0.33):
        st += barrel(x, 0, 0.97)
    out.append(join('barrelstack', st))

    # Pipes on stands, with a valve wheel and an elbow up into the air.
    pp = []
    for z, m in ((0.5, pipe_m), (0.95, pipe_r)):
        pp.append(cyl(m, 0.16, 3.6, loc=(0, 0, z), rot=(0, math.pi / 2, 0), verts=14))
        for x in (-1.8, 1.8):
            pp.append(cyl(steel_dk, 0.2, 0.1, loc=(x, 0, z), rot=(0, math.pi / 2, 0), verts=14))
    pp.append(cyl(pipe_m, 0.16, 1.6, loc=(1.6, 0, 1.3), verts=14))
    pp.append(sphere(pipe_m, 0.17, loc=(1.6, 0, 0.5), segs=12, rings=8))
    for x in (-1.2, 0.6):
        pp.append(cube(steel_dk, (0.1, 0.4, 1.0), loc=(x, 0, 0.5)))
    pp.append(cyl(pipe_r, 0.22, 0.05, loc=(-0.4, -0.2, 1.25), rot=(math.pi / 2, 0, 0), verts=16))
    for a in range(4):
        pp.append(cube(pipe_r, (0.42, 0.04, 0.04), loc=(-0.4, -0.2, 1.25), rot=(0, a * math.pi / 4, 0)))
    pp.append(cyl(steel, 0.05, 0.25, loc=(-0.4, -0.1, 1.1), verts=8))
    out.append(join('pipes', pp))

    # A warning beacon: an amber light on a striped pole.
    wl = [cyl(black, 0.07, 3.2, loc=(0, 0, 1.6), verts=10), cyl(steel_dk, 0.22, 0.1, loc=(0, 0, 0.05), verts=12)]
    for z in (0.4, 1.0, 1.6, 2.2, 2.8):
        wl.append(cyl(yellow, 0.075, 0.3, loc=(0, 0, z), verts=10))
    wl.append(cyl(steel_dk, 0.2, 0.12, loc=(0, 0, 3.25), verts=12))
    wl.append(sphere(amber, 0.19, loc=(0, 0, 3.42), scale=(1, 1, 1.2), segs=12, rings=8))
    wl.append(cyl(steel_dk, 0.07, 0.08, loc=(0, 0, 3.66), verts=10))
    out.append(join('warnlamp', wl))

    # A railing of pipe: posts and two rails, painted yellow.
    rf = [cyl(yellow, 0.05, 1.1, loc=(-1.2, 0, 0.55), verts=8), sphere(yellow, 0.06, loc=(-1.2, 0, 1.1), segs=8, rings=6)]
    for z in (0.55, 1.05):
        rf.append(cyl(yellow, 0.035, 2.4, loc=(0, 0, z), rot=(0, math.pi / 2, 0), verts=8))
    rf.append(cube(black, (0.12, 0.1, 0.1), loc=(-1.2, 0, 0.03)))
    out.append(join('pipefence', rf))

    # A cartoon warning sign: a yellow triangle with a big green goo drop.
    hs = [cyl(steel_dk, 0.04, 1.4, loc=(0, 0, 0.7), verts=8),
          cyl(black, 0.5, 0.05, loc=(0, -0.04, 1.6), rot=(math.pi / 2, 0, 0), verts=3),
          cyl(yellow, 0.42, 0.06, loc=(0, -0.05, 1.6), rot=(math.pi / 2, 0, 0), verts=3),
          sphere(goo, 0.1, loc=(0, -0.09, 1.52), scale=(1, 0.4, 1), segs=10, rings=8),
          cyl(goo, 0.1, 0.16, loc=(0, -0.09, 1.66), r2=0.0, verts=10)]
    out.append(join('hazardsign', hs))

    # A puddle of goo with a bubble about to pop.
    out.append(join('goopuddle', [sphere(goo, 0.5, loc=(0, 0, 0), scale=(1.3, 0.9, 0.06), segs=16, rings=6),
                                  sphere(goo, 0.12, loc=(0.2, -0.1, 0.05), segs=10, rings=8), sphere(goo, 0.07, loc=(-0.25, 0.1, 0.03), segs=8, rings=6)]))

    # A steam vent: a short chimney stub with a cap.
    out.append(join('steamvent', [cyl(steel, 0.3, 1.2, loc=(0, 0, 0.6), verts=14), cyl(steel_dk, 0.38, 0.12, loc=(0, 0, 1.22), verts=14),
                             cyl(steel_dk, 0.32, 0.08, loc=(0, 0, 0.04), verts=14), cyl(steel_dk, 0.31, 0.06, loc=(0, 0, 0.7), verts=14)]))


def build_mine(out):
    timber = mat('mine_timber', (150, 104, 60))
    timber_dk = mat('mine_timber_dark', (110, 74, 42))
    iron = mat('iron', (68, 68, 72))
    rock = mat('mine_rock', (110, 100, 108))
    rock_dk = mat('mine_rock_dark', (80, 72, 82))
    purple = mat('crystal_glow_purple', (200, 120, 255))
    blue = mat('crystal_glow_blue', (110, 200, 255))
    green = mat('crystal_glow_green', (120, 255, 170))
    glow = mat('lamp_light', (255, 243, 176))
    red = mat('red', (230, 60, 50))
    white = mat('white', (245, 245, 245))
    gold = mat('gold', (250, 200, 40))

    def crystal(m, x, y, h, r, tilt=0.0, yaw=0.0, z=0.0):
        o = cyl(m, r, h, loc=(0, 0, h / 2), verts=6, smooth=False)
        tip = cyl(m, r, r * 1.6, loc=(0, 0, h + r * 0.8), r2=0.0, verts=6, smooth=False)
        o = join('c', [o, tip])
        apply_tf(o)
        o.rotation_euler = (tilt, 0, yaw)
        o.location = (x, y, z)
        apply_tf(o)
        return o

    # Crystal clusters, one in each colour, glowing.
    for name, m, seed in (('crystals', purple, 3), ('crystalsblue', blue, 5), ('crystalsgreen', green, 9)):
        import random
        rnd = random.Random(seed)
        parts = [ico(rock_dk, 0.5, loc=(0, 0, 0.05), scale=(1.3, 1, 0.45), sub=1, jitter=0.3, seed=seed)]
        for k in range(6):
            a = k * 1.1
            parts.append(crystal(m, 0.25 * math.cos(a), 0.2 * math.sin(a), 0.5 + rnd.random() * 0.9, 0.09 + rnd.random() * 0.07, tilt=(rnd.random() - 0.5) * 0.9, yaw=a))
        out.append(join(name, parts))

    # A mine cart on its rails, full of ore and the odd gem.
    mc = [cube(iron, (1.2, 0.8, 0.6), loc=(0, 0, 0.6), bevel=0.04), cube(rock_dk, (1.1, 0.7, 0.1), loc=(0, 0, 0.88)),
          ico(rock, 0.3, loc=(-0.2, 0.05, 0.95), sub=1, jitter=0.3, seed=1), ico(rock, 0.28, loc=(0.25, -0.05, 0.95), sub=1, jitter=0.3, seed=2),
          crystal(purple, 0.05, 0.1, 0.35, 0.07, z=0.9)]
    for x in (-0.4, 0.4):
        for y in (-0.42, 0.42):
            mc.append(cyl(iron, 0.17, 0.08, loc=(x, y, 0.2), rot=(math.pi / 2, 0, 0), verts=12))
    for y in (-0.42, 0.42):
        mc.append(cube(iron, (2.4, 0.05, 0.06), loc=(0, y, 0.03)))
    for x in (-1.0, -0.33, 0.33, 1.0):
        mc.append(cube(timber_dk, (0.15, 1.1, 0.05), loc=(x, 0, 0.0)))
    out.append(join('minecart', mc))

    # Pit props: a timber frame holding the roof up, 2.4 m wide.
    out.append(join('pitprops', [cube(timber, (0.2, 0.2, 2.2), loc=(-1.2, 0, 1.1)), cube(timber, (2.6, 0.22, 0.22), loc=(-0.1, 0, 2.3)),
                                 cube(timber_dk, (0.12, 0.12, 0.9), loc=(-0.85, 0, 1.85), rot=(0, 0.75, 0))]))

    # A miner's lantern on a timber post.
    out.append(join('minelamp', [cube(timber, (0.16, 0.16, 2.6), loc=(0, 0, 1.3)), cube(timber_dk, (0.1, 0.5, 0.08), loc=(0, -0.22, 2.4)),
                                 cyl(iron, 0.012, 0.25, loc=(0, -0.44, 2.28), verts=4),
                                 cyl(glow, 0.12, 0.28, loc=(0, -0.44, 2.0), verts=10), cyl(iron, 0.15, 0.05, loc=(0, -0.44, 2.16), verts=10),
                                 cyl(iron, 0.15, 0.05, loc=(0, -0.44, 1.85), verts=10)]))

    # A heap of ore with a pickaxe stuck in it.
    oh = [ico(rock, 0.6, loc=(0, 0, 0.1), scale=(1.4, 1.1, 0.7), sub=1, jitter=0.4, seed=4), ico(rock_dk, 0.35, loc=(0.6, -0.2, 0.1), sub=1, jitter=0.3, seed=6),
          limb(timber, (-0.2, -0.1, 0.3), (-0.5, -0.4, 1.3), 0.04, 0.035, verts=6), cube(iron, (0.7, 0.08, 0.1), loc=(-0.5, -0.4, 1.3), rot=(0, 0.2, 0.8))]
    oh.append(crystal(blue, 0.2, -0.3, 0.3, 0.06, tilt=0.3))
    out.append(join('oreheap', oh))

    # A crate of dynamite (cartoon): red sticks poking out, a fuse.
    tn = [cube(timber, (0.8, 0.5, 0.45), loc=(0, 0, 0.23), bevel=0.02)]
    for i in range(4):
        tn.append(cyl(red, 0.06, 0.4, loc=(-0.2 + i * 0.13, 0, 0.55), verts=8))
    tn.append(limb(white, (0.2, 0, 0.75), (0.35, -0.1, 0.95), 0.01, 0.01, verts=4))
    tn.append(cube(red, (0.5, 0.02, 0.15), loc=(0, -0.26, 0.25)))
    out.append(join('tnt', tn))

    # A bucket on a rope hanging from a little winch.
    out.append(join('winch', [cube(timber, (0.12, 0.12, 1.8), loc=(-0.5, 0, 0.9)), cube(timber, (0.12, 0.12, 1.8), loc=(0.5, 0, 0.9)),
                              cyl(timber_dk, 0.12, 1.1, loc=(0, 0, 1.6), rot=(0, math.pi / 2, 0), verts=10), cyl(iron, 0.01, 0.8, loc=(0, -0.1, 1.15), verts=4),
                              cyl(iron, 0.16, 0.25, loc=(0, -0.1, 0.7), r2=0.2, verts=10), cube(iron, (0.04, 0.3, 0.04), loc=(0.62, 0.15, 1.6))]))


def build_dino(out):
    trunk = mat('cycad_trunk', (130, 96, 62))
    frond = mat('dino_frond', (70, 160, 60))
    frond2 = mat('dino_frond_light', (120, 196, 70))
    frond3 = mat('dino_frond_dark', (40, 120, 60))
    bone = mat('bone', (236, 226, 200))
    bone_dk = mat('bone_dark', (196, 182, 150))
    egg = mat('dino_egg', (240, 232, 205))
    spot = mat('dino_egg_spot', (120, 170, 90))
    straw = mat('nest_straw', (196, 160, 90))
    rock = mat('dino_rock', (150, 128, 108))
    reed = mat('horsetail', (110, 170, 70))
    amber = mat('amber_glow', (255, 170, 40))

    # Cycad: a stubby scaly trunk with a burst of stiff fronds on top.
    cy = [cyl(trunk, 0.32, 1.4, loc=(0, 0, 0.7), r2=0.26, verts=10)]
    for z in (0.3, 0.6, 0.9, 1.2):
        cy.append(cyl(trunk, 0.36, 0.1, loc=(0, 0, z), r2=0.3, verts=10))
    for k in range(10):
        cy.append(bend_strip(frond if k % 2 else frond2, 1.5, 0.28, 0.35, loc=(0, 0, 1.42), yaw=k * 2 * math.pi / 10, pitch=-0.25))
    out.append(join('cycad', cy))

    # Tree fern: a tall thin trunk, a big umbrella of drooping fronds.
    tf = [cyl(trunk, 0.18, 4.2, loc=(0, 0, 2.1), r2=0.14, verts=8)]
    for k in range(9):
        tf.append(bend_strip(frond3 if k % 3 == 0 else frond, 2.2, 0.4, 1.1, loc=(0, 0, 4.2), yaw=k * 2 * math.pi / 9, pitch=0.2))
    out.append(join('treefern', tf))

    # Horsetail reeds: a clump of jointed green stems.
    hs = []
    for k in range(7):
        a, d = k * 0.9, 0.12 + (k % 3) * 0.1
        h = 0.9 + (k % 4) * 0.3
        x, y = d * math.cos(a), d * math.sin(a)
        hs.append(cyl(reed, 0.035, h, loc=(x, y, h / 2), verts=6))
        for j in range(1, 4):
            hs.append(cyl(frond3, 0.05, 0.03, loc=(x, y, h * j / 4), verts=6))
    out.append(join('horsetail', hs))

    # A nest of straw with three big spotted eggs.
    ns = [cyl(straw, 0.8, 0.3, loc=(0, 0, 0.15), r2=0.6, verts=14)]
    for i, (x, y) in enumerate(((-0.25, 0.1), (0.25, 0.12), (0, -0.25))):
        ns.append(sphere(egg, 0.3, loc=(x, y, 0.55), scale=(1, 1, 1.35), segs=14, rings=10))
        for j in range(3):
            a = i * 2 + j * 2.1
            ns.append(sphere(spot, 0.09, loc=(x + 0.27 * math.cos(a), y + 0.27 * math.sin(a), 0.45 + j * 0.15), scale=(1, 1, 0.6), segs=8, rings=5))
    out.append(join('dinonest', ns))

    # A ribcage half buried in the ground, and a spine running into it.
    rb = [cyl(bone_dk, 0.1, 2.8, loc=(0.1, 0, 1.25), rot=(0, math.pi / 2 - 0.12, 0), verts=8)]
    for k in range(6):
        x, sc = -1.0 + k * 0.4, 1.0 - abs(k - 2) * 0.12
        top = 1.35 - k * 0.07
        for side in (-1, 1):
            pts = [(x, 0, top), (x + 0.05, side * 0.6 * sc, top - 0.2), (x + 0.1, side * 0.8 * sc, top * 0.55), (x + 0.12, side * 0.62 * sc, 0.0)]
            for a, b in zip(pts, pts[1:]):
                rb.append(limb(bone, a, b, 0.06, 0.05, verts=6))
                rb.append(sphere(bone, 0.06, loc=b, segs=6, rings=4))
    out.append(join('ribcage', rb))

    # A big friendly dinosaur skull lying on its side.
    sk = [ico(bone, 0.6, loc=(0, 0, 0.45), scale=(1.4, 0.8, 0.8), sub=2, smooth=True),
          ico(bone, 0.4, loc=(0.75, 0, 0.32), scale=(1.4, 0.7, 0.6), sub=2, smooth=True),
          sphere(rock, 0.16, loc=(0.1, -0.5, 0.55), segs=10, rings=6)]
    for k in range(5):
        sk.append(cyl(bone_dk, 0.04, 0.2, loc=(0.6 + k * 0.12, -0.3, 0.1), r2=0.0, verts=5, rot=(math.pi, 0, 0)))
    sk.append(cyl(bone_dk, 0.07, 0.5, loc=(-0.3, 0, 0.95), r2=0.0, verts=6, rot=(0, -0.5, 0)))
    out.append(join('dinoskull', sk))

    # A bone fence: big bones stuck in the ground, 2.4 m apart, with a rope between.
    out.append(join('bonefence', [cyl(bone, 0.09, 1.3, loc=(-1.2, 0, 0.65), verts=8), sphere(bone, 0.14, loc=(-1.27, 0, 1.33), segs=8, rings=6),
                                  sphere(bone, 0.14, loc=(-1.13, 0, 1.33), segs=8, rings=6),
                                  limb(straw, (-1.2, 0, 1.05), (1.2, 0, 1.05), 0.025, 0.025, verts=5)]))

    # A lump of rock with a glowing chunk of amber stuck in it.
    out.append(join('amberrock', [ico(rock, 0.7, loc=(0, 0, 0.3), scale=(1.3, 1, 0.75), sub=1, jitter=0.35, seed=71),
                                  ico(amber, 0.25, loc=(0.25, -0.5, 0.45), scale=(1, 0.7, 1.2), sub=1, jitter=0.1, seed=72)]))


def build_moon(out):
    rock = mat('moon_rock', (170, 170, 176))
    rock_dk = mat('moon_rock_dark', (120, 120, 128))
    metal = mat('moon_metal', (210, 214, 222))
    metal_dk = mat('moon_metal_dark', (90, 96, 108))
    gold = mat('foil_gold', (240, 190, 60))
    panel = mat('solar_panel', (40, 70, 160))
    white = mat('white', (245, 245, 245))
    red = mat('red', (230, 60, 50))
    orange = mat('suit_orange', (250, 140, 40))
    visor = mat('visor_glow', (120, 200, 255))
    beacon = mat('beacon_glow', (120, 255, 160))
    glow = mat('lamp_light', (255, 243, 176))

    out.append(join('moonrock', [ico(rock, 0.6, loc=(0, 0, 0.25), scale=(1.4, 1.1, 0.7), sub=1, jitter=0.35, seed=81),
                                 ico(rock_dk, 0.3, loc=(0.7, 0.2, 0.1), sub=1, jitter=0.3, seed=82)]))
    out.append(join('moonrocks', [ico(rock_dk if k % 2 else rock, 0.2 + (k % 3) * 0.12, loc=(-0.8 + k * 0.35, (k % 2) * 0.3, 0.08), sub=1, jitter=0.3, seed=83 + k) for k in range(6)]))

    # A little crater: a raised rim of dust around a dip.
    cr = []
    for k in range(10):
        a = k * 2 * math.pi / 10
        cr.append(ico(rock, 0.4, loc=(1.1 * math.cos(a), 0.8 * math.sin(a), 0.05), scale=(1.4, 1, 0.35), sub=1, jitter=0.2, seed=90 + k))
    cr.append(cyl(rock_dk, 1.0, 0.02, loc=(0, 0, 0.0), verts=16))
    out.append(join('crater', cr))

    # A lunar lander: gold foil body on four legs, a ladder and a little dish.
    ld = [cube(gold, (1.4, 1.4, 0.9), loc=(0, 0, 1.3), bevel=0.05), cyl(metal, 0.65, 0.9, loc=(0, 0, 2.2), verts=8),
          cube(visor, (0.4, 0.04, 0.3), loc=(0, -0.62, 2.3))]
    for x in (-1, 1):
        for y in (-1, 1):
            ld.append(limb(metal, (x * 0.6, y * 0.6, 1.0), (x * 1.2, y * 1.2, 0.08), 0.05, 0.05, verts=6))
            ld.append(cyl(metal, 0.2, 0.06, loc=(x * 1.2, y * 1.2, 0.03), verts=10))
    for z in (0.3, 0.55, 0.8):
        ld.append(cube(metal_dk, (0.4, 0.04, 0.04), loc=(0.9, -0.95, z)))
    ld.append(cyl(white, 0.3, 0.06, loc=(0.5, 0.3, 2.85), rot=(0.6, 0, 0), r2=0.05, verts=12))
    out.append(join('lander', ld))

    # A moon buggy: open frame, four big wire wheels, a dish on a pole.
    rv = [cube(metal, (2.0, 1.0, 0.12), loc=(0, 0, 0.55), bevel=0.02), cube(metal_dk, (0.5, 0.8, 0.5), loc=(-0.3, 0, 0.85)),
          cube(orange, (0.4, 0.7, 0.1), loc=(0.4, 0, 0.7)), cyl(metal_dk, 0.02, 0.9, loc=(0.8, 0.3, 1.0), verts=4),
          cyl(white, 0.25, 0.05, loc=(0.8, 0.3, 1.45), rot=(0.4, 0, 0), r2=0.04, verts=12)]
    for x in (-0.75, 0.75):
        for y in (-0.6, 0.6):
            rv.append(cyl(metal_dk, 0.32, 0.18, loc=(x, y, 0.32), rot=(math.pi / 2, 0, 0), verts=14))
            rv.append(cyl(gold, 0.36, 0.08, loc=(x, y * 0.85, 0.5), rot=(math.pi / 2, 0, 0), verts=14))
    out.append(join('rover', rv))

    # A satellite dish on a tripod.
    out.append(join('satdish', [cyl(white, 1.1, 0.15, loc=(0, 0, 2.1), rot=(0.7, 0, 0), r2=0.15, verts=20),
                                cyl(metal_dk, 0.03, 0.9, loc=(0, -0.4, 2.4), rot=(0.7, 0, 0), verts=4),
                                limb(metal, (0, 0, 1.9), (0.6, 0.4, 0), 0.05, 0.05), limb(metal, (0, 0, 1.9), (-0.6, 0.4, 0), 0.05, 0.05),
                                limb(metal, (0, 0, 1.9), (0, -0.7, 0), 0.05, 0.05)]))

    # A big fuel tank on its side in a cradle, striped.
    out.append(join('fueltank', [cyl(white, 0.6, 2.2, loc=(0, 0, 0.8), rot=(0, math.pi / 2, 0), verts=16), cyl(red, 0.61, 0.2, loc=(0.5, 0, 0.8), rot=(0, math.pi / 2, 0), verts=16),
                                 cyl(red, 0.61, 0.2, loc=(-0.5, 0, 0.8), rot=(0, math.pi / 2, 0), verts=16),
                                 cube(metal_dk, (0.15, 1.0, 0.3), loc=(-0.7, 0, 0.15)), cube(metal_dk, (0.15, 1.0, 0.3), loc=(0.7, 0, 0.15))]))

    # A solar panel on a stand.
    out.append(join('solarpanel', [cyl(metal_dk, 0.05, 1.2, loc=(0, 0, 0.6), verts=6), cube(panel, (2.0, 1.2, 0.05), loc=(0, 0, 1.3), rot=(0.5, 0, 0)),
                                   cube(metal, (2.05, 0.04, 0.07), loc=(0, -0.53, 1.0), rot=(0.5, 0, 0))]))

    # A flag of the Pumped Space Club (made up): a white flag with a big orange star.
    fl = [cyl(metal, 0.03, 2.4, loc=(0, 0, 1.2), verts=6), cube(white, (1.2, 0.02, 0.8), loc=(0.62, 0, 2.0)), cyl(metal, 0.02, 1.25, loc=(0.62, 0, 2.41), rot=(0, math.pi / 2, 0), verts=4)]
    st = []
    for k in range(5):
        a = math.pi / 2 + k * 2 * math.pi / 5
        st.append(cube(orange, (0.08, 0.02, 0.28), loc=(0.62 + 0.12 * math.cos(a), -0.02, 2.0 + 0.12 * math.sin(a)), rot=(0, -a + math.pi / 2, 0)))
    st.append(cyl(orange, 0.12, 0.02, loc=(0.62, -0.02, 2.0), rot=(math.pi / 2, 0, 0), verts=10))
    out.append(join('moonflag', fl + st))

    # A lamp post: a slim mast with a lamp and a green beacon on top.
    out.append(join('moonlamp', [cyl(metal_dk, 0.07, 3.0, loc=(0, 0, 1.5), verts=8), cube(metal, (0.12, 0.6, 0.08), loc=(0, -0.25, 2.9)),
                                 cyl(glow, 0.14, 0.12, loc=(0, -0.5, 2.82), verts=10), sphere(beacon, 0.09, loc=(0, 0, 3.08), segs=8, rings=6)]))

    # A barrier: a low rail on posts with stripes, 2.4 m apart.
    out.append(join('moonfence', [cyl(metal_dk, 0.05, 0.9, loc=(-1.2, 0, 0.45), verts=6), cube(white, (2.4, 0.05, 0.12), loc=(0, 0, 0.8)),
                                  cube(red, (0.3, 0.06, 0.13), loc=(-0.6, 0, 0.8)), cube(red, (0.3, 0.06, 0.13), loc=(0.6, 0, 0.8))]))

    # An astronaut waving hello, in a white suit with a gold visor.
    asn = [cube(white, (0.6, 0.42, 0.65), loc=(0, 0, 1.1), bevel=0.14), cube(white, (0.5, 0.25, 0.5), loc=(0, 0.28, 1.15), bevel=0.05),
           sphere(white, 0.27, loc=(0, 0, 1.62), segs=14, rings=10), sphere(gold, 0.2, loc=(0, -0.17, 1.63), scale=(1, 0.6, 0.8), segs=12, rings=8)]
    for x in (-0.15, 0.15):
        asn.append(cyl(white, 0.13, 0.75, loc=(x, 0, 0.45), verts=10))
        asn.append(cube(metal_dk, (0.18, 0.28, 0.1), loc=(x, -0.05, 0.05), bevel=0.03))
    asn.append(limb(white, (-0.3, 0, 1.25), (-0.45, 0, 0.85), 0.09, 0.08))
    asn.append(limb(white, (0.3, 0, 1.25), (0.55, 0, 1.75), 0.09, 0.08))
    asn.append(sphere(white, 0.1, loc=(0.57, 0, 1.82), segs=8, rings=6))
    asn.append(cube(orange, (0.2, 0.02, 0.1), loc=(0, -0.29, 1.2)))
    out.append(join('astronaut', asn))


def build_sky(out):
    bark = mat('sky_bark', (150, 110, 80))
    puff = mat('sky_leaf', (120, 210, 120))
    puff2 = mat('sky_leaf_light', (170, 230, 140))
    blossom = mat('sky_blossom', (255, 180, 210))
    marble = mat('marble', (240, 236, 228))
    marble_dk = mat('marble_dark', (200, 196, 188))
    rope = mat('rope', (200, 170, 120))
    wood = mat('sky_wood', (170, 120, 80))
    flower_r = mat('flower_red', (240, 80, 90))
    flower_y = mat('flower_yellow', (255, 214, 70))
    flower_b = mat('flower_blue', (110, 150, 255))
    leaf = mat('sky_bush', (80, 170, 90))
    sail = mat('pinwheel_a', (255, 120, 60))
    sail2 = mat('pinwheel_b', (80, 170, 255))
    glow = mat('lamp_light', (255, 243, 176))
    gold = mat('gold', (250, 200, 40))

    # A round, puffy tree, and one in pink blossom.
    for name, m1, m2, seed in (('puffytree', puff, puff2, 101), ('blossomtree', blossom, puff2, 105)):
        t = [cyl(bark, 0.18, 2.4, loc=(0, 0, 1.2), r2=0.12, verts=8)]
        for i, (x, y, z, r) in enumerate([(0, 0, 3.0, 1.2), (0.7, 0.2, 2.6, 0.8), (-0.7, -0.1, 2.7, 0.85), (0.1, -0.5, 3.5, 0.7)]):
            t.append(ico(m1 if i % 2 == 0 else m2, r, loc=(x, y, z), sub=2, jitter=0.12, seed=seed + i, smooth=True))
        out.append(join(name, t))

    # A bush covered in flowers.
    fb = [ico(leaf, 0.55, loc=(0, 0, 0.35), scale=(1.4, 1.1, 0.8), sub=2, jitter=0.15, seed=110, smooth=True)]
    for k in range(9):
        a = k * 2.4
        fb.append(sphere((flower_r, flower_y, flower_b)[k % 3], 0.11, loc=(0.55 * math.cos(a), 0.42 * math.sin(a), 0.6 + (k % 3) * 0.08), segs=8, rings=5))
    out.append(join('flowerbush', fb))

    # A broken marble column from an old sky temple.
    col = [cube(marble_dk, (0.9, 0.9, 0.25), loc=(0, 0, 0.12), bevel=0.03), cyl(marble, 0.32, 2.2, loc=(0, 0, 1.35), verts=14)]
    for k in range(8):
        a = k * math.pi / 4
        col.append(cube(marble_dk, (0.05, 0.05, 2.2), loc=(0.31 * math.cos(a), 0.31 * math.sin(a), 1.35)))
    col.append(ico(marble, 0.35, loc=(0.6, -0.3, 0.15), scale=(1.2, 1, 0.6), sub=1, jitter=0.2, seed=112))
    out.append(join('skycolumn', col))

    # A pinwheel on a stick.
    pw = [cyl(wood, 0.03, 1.8, loc=(0, 0, 0.9), verts=6), sphere(gold, 0.06, loc=(0, -0.05, 1.8), segs=8, rings=6)]
    for k in range(4):
        a = k * math.pi / 2
        pw.append(cube(sail if k % 2 else sail2, (0.35, 0.02, 0.18), loc=(0.2 * math.cos(a), -0.04, 1.8 + 0.2 * math.sin(a)), rot=(0, -a, 0)))
    out.append(join('pinwheel', pw))

    # A rope fence: wooden posts 2.4 m apart with a sagging rope.
    rf = [cyl(wood, 0.07, 1.1, loc=(-1.2, 0, 0.55), verts=8)]
    for k in range(6):
        t0, t1 = k / 6, (k + 1) / 6
        z0, z1 = 0.95 - 0.25 * math.sin(math.pi * t0), 0.95 - 0.25 * math.sin(math.pi * t1)
        rf.append(limb(rope, (-1.2 + 2.4 * t0, 0, z0), (-1.2 + 2.4 * t1, 0, z1), 0.025, 0.025, verts=5))
    out.append(join('ropefence', rf))

    # A lantern on a curly post.
    out.append(join('skylamp', [cyl(wood, 0.06, 2.6, loc=(0, 0, 1.3), verts=8), limb(wood, (0, 0, 2.55), (0, -0.4, 2.7), 0.04, 0.04, verts=6),
                                cyl(glow, 0.12, 0.3, loc=(0, -0.45, 2.38), verts=8), cyl(gold, 0.15, 0.05, loc=(0, -0.45, 2.55), r2=0.05, verts=8)]))

    # A little cloud resting on the ground.
    out.append(join('groundcloud', [sphere(mat('cloud_white', (250, 250, 255)), r, loc=(x, 0, z), segs=12, rings=8)
                                    for x, z, r in ((-0.6, 0.4, 0.5), (0, 0.6, 0.7), (0.6, 0.4, 0.5), (0.3, 0.9, 0.45))]))


if __name__ == '__main__':
    import sys
    which = sys.argv[1:] or ['skater', 'scooter', 'props']
    if 'skater' in which:
        build_skater()
    if 'scooter' in which:
        build_scooter()
    if 'props' in which:
        build_props()
